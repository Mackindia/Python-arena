from __future__ import annotations

import json
import re
from collections import Counter
from typing import Any


def _norm(text: str) -> str:
    return re.sub(r"\s+", " ", text.strip().lower())


def validate_text_grounding(text: str, context: str) -> list[str]:
    issues: list[str] = []
    context_norm = _norm(context)

    if not text.strip():
        return ["Generated output is empty."]

    if context_norm and len(context_norm) > 20:
        sample = _norm(text)
        if not any(fragment in context_norm for fragment in sample.split()[:8]):
            issues.append("Output does not appear grounded in retrieved context.")

    return issues


def validate_mcq_payload(items: list[dict[str, Any]], context: str, count: int) -> dict[str, Any]:
    issues: list[str] = []
    q_texts = [_norm(str(item.get("question", ""))) for item in items if str(item.get("question", "")).strip()]
    answer_counts: Counter[str] = Counter()

    if len(items) != count:
        issues.append(f"Expected {count} questions, got {len(items)}")

    if len(set(q_texts)) != len(q_texts):
        issues.append("Duplicate questions detected")

    for idx, item in enumerate(items, start=1):
        options = item.get("options", [])
        answer = str(item.get("answer", "")).strip()
        explanation = str(item.get("explanation", "")).strip()
        if not options or len(options) < 4:
            issues.append(f"Q{idx}: invalid options")
        if not answer:
            issues.append(f"Q{idx}: missing answer")
        else:
            answer_counts[_norm(answer)] += 1
        if not explanation:
            issues.append(f"Q{idx}: missing explanation")

    grounding_issues = validate_text_grounding("\n".join(q_texts), context)
    issues.extend(grounding_issues)

    score = max(0, 100 - len(issues) * 5)
    return {
        "valid": not issues,
        "quality_score": score,
        "issues": issues,
        "answer_distribution": dict(answer_counts),
    }


def validate_coverage(items: list[dict[str, Any]], required_fields: list[str]) -> list[str]:
    issues: list[str] = []
    for idx, item in enumerate(items, start=1):
        for field in required_fields:
            if not str(item.get(field, "")).strip():
                issues.append(f"Q{idx}: missing {field}")
    return issues


_STOP_WORDS = frozenset({
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "can", "shall", "must", "need",
    "in", "on", "at", "to", "for", "of", "with", "by", "from", "as",
    "into", "through", "during", "before", "after", "above", "below",
    "between", "under", "again", "further", "then", "once",
    "what", "which", "who", "whom", "where", "when", "why", "how",
    "all", "each", "every", "both", "few", "more", "most", "other",
    "some", "such", "no", "nor", "not", "only", "own", "same", "so",
    "than", "too", "very", "just", "because", "if", "about",
    "define", "explain", "describe", "list", "name", "mention",
})


def _tokenize(text: str) -> set[str]:
    words = re.findall(r"[a-z]+", _norm(text))
    return {w for w in words if w not in _STOP_WORDS and len(w) > 2}


def _jaccard_similarity(a: set[str], b: set[str]) -> float:
    if not a or not b:
        return 0.0
    return len(a & b) / len(a | b)


def _extract_all_questions(worksheet: dict[str, Any]) -> list[dict[str, Any]]:
    """Flatten all questions from all sections into a unified list."""
    units: list[dict[str, Any]] = []
    sections = worksheet.get("sections", [])
    for section in sections:
        section_type = section.get("type", "")
        for q in section.get("questions", []):
            units.append({"type": section_type, "question": q})
    return units


def validate_worksheet_payload(worksheet: dict[str, Any], context: str) -> dict[str, Any]:
    """Validate a worksheet payload for structure, duplicates, and diversity."""
    issues: list[str] = []

    # --- Structure checks ---
    if not worksheet.get("sections"):
        issues.append("Missing 'sections' array")
        return {"valid": False, "issues": issues, "quality_score": 0}

    expected_types = {"MCQs", "Fill in the Blanks", "Match the Following", "Short Answer Questions", "Long Answer Questions"}
    actual_types = {s.get("type") for s in worksheet.get("sections", [])}
    missing = expected_types - actual_types
    if missing:
        issues.append(f"Missing section types: {', '.join(missing)}")

    # --- Collect all question texts ---
    all_units = _extract_all_questions(worksheet)
    q_texts: list[str] = []
    for unit in all_units:
        q = unit["question"]
        text = q.get("question_text", "") or q.get("question", "")
        if text.strip():
            q_texts.append(_norm(text))

    # --- Exact duplicate check ---
    if len(set(q_texts)) != len(q_texts):
        issues.append("Exact duplicate questions detected")

    # --- Near-duplicate check (Jaccard on content words) ---
    tokens = [_tokenize(t) for t in q_texts]
    near_dup_count = 0
    for i in range(len(tokens)):
        for j in range(i + 1, len(tokens)):
            if _jaccard_similarity(tokens[i], tokens[j]) >= 0.70:
                near_dup_count += 1
    if near_dup_count:
        issues.append(f"Near-duplicate questions detected: {near_dup_count} pairs (similar wording)")

    # --- MCQ-specific checks ---
    mcq_units = [u for u in all_units if u["type"] == "MCQs"]
    mcq_answers: list[str] = []
    for u in mcq_units:
        ans = _norm(str(u["question"].get("correct_option", "")))
        if ans:
            mcq_answers.append(ans)
    if len(set(mcq_answers)) < len(mcq_answers) and len(mcq_answers) > 1:
        dup_count = len(mcq_answers) - len(set(mcq_answers))
        issues.append(f"MCQ section has {dup_count} questions with same correct option letter")

    # --- Fill-blank answer diversity ---
    fb_units = [u for u in all_units if u["type"] == "Fill in the Blanks"]
    fb_answers = [_norm(str(u["question"].get("correct_answer", ""))) for u in fb_units if u["question"].get("correct_answer")]
    if len(set(fb_answers)) < len(fb_answers) and len(fb_answers) > 1:
        issues.append("Fill-in-the-blanks section has repeated answers")

    # --- Grounding check ---
    grounding = validate_text_grounding(json.dumps(worksheet, default=str), context)
    issues.extend(grounding)

    score = max(0, 100 - len(issues) * 8)
    return {
        "valid": not issues,
        "quality_score": score,
        "issues": issues,
        "question_count": len(all_units),
        "near_duplicate_pairs": near_dup_count,
    }
