# app/core/generator.py
# ─────────────────────────────────────────────────────────────────────────────
# All AI generation functions live here.
# Each function = one feature of our pipeline.
# Pattern: load text → build prompt → call model → return result
# ─────────────────────────────────────────────────────────────────────────────

import json
import math
import re
from collections import Counter
from typing import Any

from app.core.llm import get_model
from app.core.pdf_processor import extract_text


def load_text_from_path(file_path: str) -> str:
    """Helper: extract text from a saved PDF file."""
    result = extract_text(file_path)
    return result["text"]


def _allocate_counts(total: int, ratios: dict[str, float]) -> dict[str, int]:
    """Convert ratio targets into integer counts that sum exactly to total."""
    raw = {k: total * v for k, v in ratios.items()}
    base = {k: int(math.floor(v)) for k, v in raw.items()}
    remainder = total - sum(base.values())
    ordered = sorted(raw.items(), key=lambda kv: kv[1] - base[kv[0]], reverse=True)

    for i in range(remainder):
        base[ordered[i % len(ordered)][0]] += 1

    return base


def _extract_json_array(raw_text: str) -> list[dict[str, Any]]:
    """Best-effort extraction for JSON array output from model responses."""
    cleaned = raw_text.strip()

    fenced = re.search(r"```(?:json)?\s*(\[.*\])\s*```", cleaned, flags=re.DOTALL)
    if fenced:
        cleaned = fenced.group(1)

    if not cleaned.startswith("["):
        start = cleaned.find("[")
        end = cleaned.rfind("]")
        if start != -1 and end != -1 and end > start:
            cleaned = cleaned[start : end + 1]

    parsed = json.loads(cleaned)
    if not isinstance(parsed, list):
        raise ValueError("Model output is not a JSON array.")

    return parsed


def _norm(text: str) -> str:
    return re.sub(r"\s+", " ", text.strip().lower())


def _normalize_label(value: str, mapping: dict[str, str], default: str = "") -> str:
    key = _norm(value)
    return mapping.get(key, default)


def _validate_mcq_quality(
    questions: list[dict[str, Any]],
    chapter_text: str,
    num_questions: int,
    difficulty_target: dict[str, int],
    type_target: dict[str, int],
    bloom_target: dict[str, int],
) -> tuple[list[str], dict[str, Any]]:
    """Validate generated MCQs against strict quality rules."""
    issues: list[str] = []
    stats: dict[str, Any] = {}

    if len(questions) != num_questions:
        issues.append(f"Expected {num_questions} questions, got {len(questions)}")

    qnorm = [_norm(str(q.get("question", ""))) for q in questions]
    if len(set(qnorm)) != len(qnorm):
        issues.append("Duplicate or near-duplicate question stems detected")

    # Category normalizers
    difficulty_map = {
        "easy": "Easy",
        "medium": "Medium",
        "hard": "Hard",
    }

    type_map = {
        "concept understanding": "Concept Understanding",
        "conceptual": "Concept Understanding",
        "application-based": "Application-Based",
        "application": "Application-Based",
        "analytical thinking": "Analytical Thinking",
        "analysis": "Analytical Thinking",
        "scenario-based": "Scenario-Based",
        "scenario": "Scenario-Based",
        "higher order thinking": "Higher Order Thinking",
        "hots": "Higher Order Thinking",
    }

    bloom_map = {
        "remember": "Remember",
        "understand": "Understand",
        "apply": "Apply",
        "analyze": "Analyze",
        "evaluate": "Evaluate",
        "create": "Create",
    }

    difficulty_counter: Counter[str] = Counter()
    qtype_counter: Counter[str] = Counter()
    bloom_counter: Counter[str] = Counter()
    answer_letter_counter: Counter[str] = Counter()

    text_norm = _norm(chapter_text)

    for idx, q in enumerate(questions, start=1):
        question = str(q.get("question", "")).strip()
        options = q.get("options")
        answer_letter = str(q.get("answer_letter", "")).strip().upper()
        answer_text = str(q.get("answer_text", "")).strip()
        explanation = str(q.get("explanation", "")).strip()
        source_evidence = str(q.get("source_evidence", "")).strip()

        if not question:
            issues.append(f"Q{idx}: missing question text")

        if not isinstance(options, dict):
            issues.append(f"Q{idx}: options must be an object with A/B/C/D keys")
            continue

        missing_keys = [k for k in ["A", "B", "C", "D"] if k not in options]
        if missing_keys:
            issues.append(f"Q{idx}: missing option keys {missing_keys}")

        option_values = [str(options.get(k, "")).strip() for k in ["A", "B", "C", "D"]]
        if any(not v for v in option_values):
            issues.append(f"Q{idx}: empty option text detected")

        if len(set(_norm(v) for v in option_values)) < 4:
            issues.append(f"Q{idx}: duplicate options detected")

        if answer_letter not in {"A", "B", "C", "D"}:
            issues.append(f"Q{idx}: invalid answer letter '{answer_letter}'")
        else:
            answer_letter_counter[answer_letter] += 1

        if answer_letter in options and answer_text and _norm(answer_text) != _norm(str(options[answer_letter])):
            issues.append(f"Q{idx}: answer_text does not match option {answer_letter}")

        if not explanation:
            issues.append(f"Q{idx}: missing explanation")

        if not source_evidence:
            issues.append(f"Q{idx}: missing source_evidence")
        elif _norm(source_evidence) not in text_norm:
            issues.append(f"Q{idx}: source_evidence not found in chapter context")

        difficulty = _normalize_label(str(q.get("difficulty", "")), difficulty_map)
        qtype = _normalize_label(str(q.get("question_type", "")), type_map)
        bloom = _normalize_label(str(q.get("bloom_level", "")), bloom_map)

        if not difficulty:
            issues.append(f"Q{idx}: invalid difficulty label")
        else:
            difficulty_counter[difficulty] += 1

        if not qtype:
            issues.append(f"Q{idx}: invalid question_type label")
        else:
            qtype_counter[qtype] += 1

        if not bloom:
            issues.append(f"Q{idx}: invalid bloom_level label")
        else:
            bloom_counter[bloom] += 1

    for label, expected in difficulty_target.items():
        if difficulty_counter[label] != expected:
            issues.append(
                f"Difficulty distribution mismatch for {label}: expected {expected}, got {difficulty_counter[label]}"
            )

    for label, expected in type_target.items():
        if qtype_counter[label] != expected:
            issues.append(
                f"Question type distribution mismatch for {label}: expected {expected}, got {qtype_counter[label]}"
            )

    for label, expected in bloom_target.items():
        if bloom_counter[label] != expected:
            issues.append(
                f"Bloom distribution mismatch for {label}: expected {expected}, got {bloom_counter[label]}"
            )

    # Answer distribution rule: each option should be between 20% and 30%
    min_per_option = int(math.floor(num_questions * 0.20))
    max_per_option = int(math.ceil(num_questions * 0.30))
    for letter in ["A", "B", "C", "D"]:
        count = answer_letter_counter[letter]
        if not (min_per_option <= count <= max_per_option):
            issues.append(
                f"Answer distribution mismatch for {letter}: expected between {min_per_option} and {max_per_option}, got {count}"
            )

    app_required = int(math.ceil(num_questions * 0.25))
    scenario_required = int(math.ceil(num_questions * 0.15))
    hots_required = int(math.ceil(num_questions * 0.10))

    if qtype_counter["Application-Based"] < app_required:
        issues.append(
            f"Application-based questions below minimum: need {app_required}, got {qtype_counter['Application-Based']}"
        )
    if qtype_counter["Scenario-Based"] < scenario_required:
        issues.append(
            f"Scenario-based questions below minimum: need {scenario_required}, got {qtype_counter['Scenario-Based']}"
        )
    if qtype_counter["Higher Order Thinking"] < hots_required:
        issues.append(
            f"Higher order questions below minimum: need {hots_required}, got {qtype_counter['Higher Order Thinking']}"
        )

    stats["difficulty"] = dict(difficulty_counter)
    stats["question_type"] = dict(qtype_counter)
    stats["bloom"] = dict(bloom_counter)
    stats["answers"] = dict(answer_letter_counter)

    return issues, stats


def _format_mcqs(questions: list[dict[str, Any]]) -> str:
    """Render MCQs in mandatory single-line options format."""
    blocks: list[str] = []
    for i, q in enumerate(questions, start=1):
        question = str(q["question"]).strip()
        options = q["options"]
        answer_letter = str(q["answer_letter"]).strip().upper()
        answer_text = str(q["answer_text"]).strip() or str(options[answer_letter]).strip()
        explanation = str(q["explanation"]).strip()

        block = (
            f"{i}. {question}\n\n"
            f"A) {str(options['A']).strip()} B) {str(options['B']).strip()} "
            f"C) {str(options['C']).strip()} D) {str(options['D']).strip()}\n\n"
            f"Answer: {answer_letter}) {answer_text}\n"
            f"Explanation: {explanation}"
        )
        blocks.append(block)

    return "\n\n".join(blocks)


def _build_mcq_json_prompt(
    chapter_text: str,
    grade: str,
    num_questions: int,
    difficulty_target: dict[str, int],
    type_target: dict[str, int],
    bloom_target: dict[str, int],
    attempt: int,
    failure_reasons: list[str] | None = None,
) -> str:
    retry_section = ""
    if attempt > 1 and failure_reasons:
        reasons = "\n".join(f"- {r}" for r in failure_reasons[:20])
        retry_section = (
            "\nPrevious output failed validation. Regenerate fully and fix ALL issues below:\n"
            f"{reasons}\n"
        )

    return f"""
You are an expert CBSE assessment designer building classroom-ready questions.

Generate EXACTLY {num_questions} MCQs for {grade} from the provided chapter context.
Do not hallucinate. Every question must be grounded in the chapter text.
{retry_section}
MANDATORY QUALITY POLICY:
- Not simple copy-paste recall questions.
- Prioritize concept understanding, application, analysis, reasoning, and problem-solving.
- No duplicate questions or reworded duplicates.
- Avoid excessive repetition of the same concept.
- Wrong options must be plausible distractors.

MANDATORY DISTRIBUTIONS:
Difficulty (exact counts):
- Easy: {difficulty_target['Easy']}
- Medium: {difficulty_target['Medium']}
- Hard: {difficulty_target['Hard']}

Question Type (exact counts):
- Concept Understanding: {type_target['Concept Understanding']}
- Application-Based: {type_target['Application-Based']}
- Analytical Thinking: {type_target['Analytical Thinking']}
- Scenario-Based: {type_target['Scenario-Based']}
- Higher Order Thinking: {type_target['Higher Order Thinking']}

Bloom's Taxonomy (exact counts):
- Remember: {bloom_target['Remember']}
- Understand: {bloom_target['Understand']}
- Apply: {bloom_target['Apply']}
- Analyze: {bloom_target['Analyze']}
- Evaluate: {bloom_target['Evaluate']}
- Create: {bloom_target['Create']}

ANSWER DISTRIBUTION:
- Correct answer letters must be balanced across A/B/C/D.
- Each letter should be between 20% and 30% of total questions.

Output ONLY valid JSON array. No markdown. No code fences.
Use this exact schema for each item:
{{
  "question": "string",
  "options": {{"A": "string", "B": "string", "C": "string", "D": "string"}},
  "answer_letter": "A|B|C|D",
  "answer_text": "string (must exactly match the correct option text)",
  "explanation": "string (1-2 lines, based on chapter)",
  "difficulty": "Easy|Medium|Hard",
  "question_type": "Concept Understanding|Application-Based|Analytical Thinking|Scenario-Based|Higher Order Thinking",
  "bloom_level": "Remember|Understand|Apply|Analyze|Evaluate|Create",
  "source_evidence": "short exact phrase from chapter text (4-15 words)"
}}

Chapter Context:
{chapter_text}
"""


# ─── Feature 1: Generate Notes ───────────────────────────────────────────────

def generate_notes(file_path: str, grade: str = "Class 6") -> dict:
    """
    Generate structured study notes from a PDF chapter.

    Args:
        file_path : path to the uploaded PDF (from /upload response)
        grade     : target grade level — affects language complexity

    Returns:
        dict with notes (markdown) + metadata
    """
    text = load_text_from_path(file_path)
    model = get_model("fast")  # gemini-2.5-flash is perfect for notes

    prompt = f"""You are an expert teacher creating study notes for {grade} students.

From the chapter content below, create well-structured study notes with these sections:

## 📌 Key Concepts
List each major concept with a clear, simple definition (1-2 sentences max).

## 📖 Important Terms (Glossary)
Term | Definition
(table format)

## 💡 Main Ideas
For each major topic, give 3-5 bullet points summarizing the core ideas.

## ⭐ Remember This (Exam Points)
List the most important facts a student must remember for exams.

## ❓ Think About It
2-3 thought-provoking questions to test understanding.

Rules:
- Use simple language appropriate for a {grade} student
- Be concise — notes should be easier to read than the original
- Format everything in clean Markdown
- Do NOT copy paste paragraphs — rephrase in student-friendly language

Chapter Content:
{text}"""

    response = model.generate_content(prompt)

    return {
        "grade": grade,
        "source": file_path,
        "notes": response.text,
        "estimated_read_time": f"{max(1, len(response.text.split()) // 200)} min",
    }
    # ─── Feature 2: Generate MCQs ───────────────────────────────────────────────

def generate_mcqs(
    file_path: str,
    grade: str = "Class 6",
    num_questions: int = 20,
    difficulty: str = "medium-hard",
    question_type: str = "mixed",
):
    """
    Generate MCQs from a PDF chapter.
    """

    text = load_text_from_path(file_path)

    # Prevent huge PDFs from overflowing token limits
    text = text[:50000]

    model = get_model("fast")

    difficulty_target = _allocate_counts(
        num_questions,
        {"Easy": 0.20, "Medium": 0.50, "Hard": 0.30},
    )
    type_target = _allocate_counts(
        num_questions,
        {
            "Concept Understanding": 0.25,
            "Application-Based": 0.25,
            "Analytical Thinking": 0.20,
            "Scenario-Based": 0.15,
            "Higher Order Thinking": 0.15,
        },
    )
    bloom_target = _allocate_counts(
        num_questions,
        {
            "Remember": 0.20,
            "Understand": 0.25,
            "Apply": 0.25,
            "Analyze": 0.15,
            "Evaluate": 0.10,
            "Create": 0.05,
        },
    )

    validation_issues: list[str] = []
    quality_stats: dict[str, Any] = {}
    parsed_questions: list[dict[str, Any]] = []
    raw_response_text = ""

    for attempt in range(1, 4):
        prompt = _build_mcq_json_prompt(
            chapter_text=text,
            grade=grade,
            num_questions=num_questions,
            difficulty_target=difficulty_target,
            type_target=type_target,
            bloom_target=bloom_target,
            attempt=attempt,
            failure_reasons=validation_issues,
        )

        response = model.generate_content(prompt)
        raw_response_text = response.text or ""

        try:
            parsed_questions = _extract_json_array(raw_response_text)
        except Exception as parse_error:
            validation_issues = [f"JSON parse error: {parse_error}"]
            continue

        validation_issues, quality_stats = _validate_mcq_quality(
            questions=parsed_questions,
            chapter_text=text,
            num_questions=num_questions,
            difficulty_target=difficulty_target,
            type_target=type_target,
            bloom_target=bloom_target,
        )

        if not validation_issues:
            break

    if validation_issues:
        raise ValueError(
            "Generated MCQs did not satisfy quality policy after retries. "
            f"Issues: {', '.join(validation_issues[:10])}"
        )

    rendered_mcqs = _format_mcqs(parsed_questions)

    return {
        "grade": grade,
        "difficulty": difficulty,
        "question_type": question_type,
        "num_questions": num_questions,
        "source": file_path,
        "mcqs": rendered_mcqs,
        "quality_targets": {
            "difficulty": difficulty_target,
            "question_type": type_target,
            "bloom": bloom_target,
        },
        "quality_stats": quality_stats,
        "validation": {
            "status": "passed",
            "checks": [
                "No duplicate question stems",
                "Balanced difficulty distribution",
                "Balanced Bloom levels",
                "Balanced answer distribution",
                "Application and scenario requirements met",
                "All questions grounded in PDF context",
                "Mandatory one-line option format applied",
            ],
        },
        "raw_json": parsed_questions,
    }
