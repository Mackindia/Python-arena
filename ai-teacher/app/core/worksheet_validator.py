import math
import re
from collections import Counter
from typing import Any

# Canonical worksheet section sizes
SECTION_COUNTS = {
    "section_a_mcqs": 10,
    "section_b_fill_blanks": 10,
    "section_c_short_answers": 8,
    "section_d_long_answers": 5,
    "section_e_application": 5,
    "section_f_case_studies": 3,
}
CASE_STUDY_QUESTIONS_PER_CASE = 3

TOTAL_QUESTION_UNITS = (
    SECTION_COUNTS["section_a_mcqs"]
    + SECTION_COUNTS["section_b_fill_blanks"]
    + SECTION_COUNTS["section_c_short_answers"]
    + SECTION_COUNTS["section_d_long_answers"]
    + SECTION_COUNTS["section_e_application"]
    + (SECTION_COUNTS["section_f_case_studies"] * CASE_STUDY_QUESTIONS_PER_CASE)
)

DIFFICULTY_RATIOS = {"Easy": 0.20, "Medium": 0.50, "Hard": 0.30}
BLOOM_RATIOS = {
    "Remember": 0.20,
    "Understand": 0.25,
    "Apply": 0.25,
    "Analyze": 0.15,
    "Evaluate": 0.10,
    "Create": 0.05,
}
QUESTION_TYPE_RATIOS = {
    "Concept Understanding": 0.25,
    "Application-Based": 0.25,
    "Analytical Thinking": 0.20,
    "Scenario-Based": 0.15,
    "Higher Order Thinking": 0.15,
}

DIFFICULTY_CANONICAL = {
    "easy": "Easy",
    "medium": "Medium",
    "hard": "Hard",
}

BLOOM_CANONICAL = {
    "remember": "Remember",
    "understand": "Understand",
    "apply": "Apply",
    "analyze": "Analyze",
    "evaluate": "Evaluate",
    "create": "Create",
}

QUESTION_TYPE_CANONICAL = {
    "concept understanding": "Concept Understanding",
    "conceptual": "Concept Understanding",
    "application-based": "Application-Based",
    "application": "Application-Based",
    "analytical thinking": "Analytical Thinking",
    "analytical": "Analytical Thinking",
    "scenario-based": "Scenario-Based",
    "scenario": "Scenario-Based",
    "higher order thinking": "Higher Order Thinking",
    "hots": "Higher Order Thinking",
}


def _norm(text: str) -> str:
    return re.sub(r"\s+", " ", text.strip().lower())


def _allocate_counts(total: int, ratios: dict[str, float]) -> dict[str, int]:
    raw = {k: total * v for k, v in ratios.items()}
    base = {k: int(math.floor(v)) for k, v in raw.items()}
    remainder = total - sum(base.values())
    ordered = sorted(raw.items(), key=lambda kv: kv[1] - base[kv[0]], reverse=True)

    for i in range(remainder):
        base[ordered[i % len(ordered)][0]] += 1

    return base


def build_distribution_targets(total_questions: int = TOTAL_QUESTION_UNITS) -> dict[str, dict[str, int]]:
    return {
        "difficulty": _allocate_counts(total_questions, DIFFICULTY_RATIOS),
        "bloom": _allocate_counts(total_questions, BLOOM_RATIOS),
        "question_type": _allocate_counts(total_questions, QUESTION_TYPE_RATIOS),
    }


def _safe_get_list(container: dict[str, Any], key: str) -> list[dict[str, Any]]:
    value = container.get(key, [])
    return value if isinstance(value, list) else []


def _canonicalize(value: str, mapping: dict[str, str]) -> str:
    return mapping.get(_norm(value), "")


def _tokenize_question(text: str) -> set[str]:
    lowered = _norm(text)
    tokens = set(re.findall(r"[a-z0-9]+", lowered))
    stop_words = {
        "the",
        "is",
        "are",
        "a",
        "an",
        "of",
        "and",
        "or",
        "to",
        "in",
        "for",
        "with",
        "on",
        "what",
        "which",
        "why",
        "how",
        "when",
        "where",
        "explain",
        "define",
    }
    return {t for t in tokens if t not in stop_words}


def _near_duplicate_ratio(a: str, b: str) -> float:
    ta = _tokenize_question(a)
    tb = _tokenize_question(b)
    if not ta or not tb:
        return 0.0
    intersection = len(ta.intersection(tb))
    union = len(ta.union(tb))
    return intersection / union if union else 0.0


def _collect_question_units(worksheet: dict[str, Any]) -> list[dict[str, Any]]:
    sections = worksheet.get("sections", {})
    units: list[dict[str, Any]] = []

    for item in _safe_get_list(sections, "section_a_mcqs"):
        units.append(
            {
                "section": "section_a_mcqs",
                "question": str(item.get("question", "")).strip(),
                "difficulty": str(item.get("difficulty", "")).strip(),
                "bloom": str(item.get("bloom_level", "")).strip(),
                "question_type": str(item.get("question_type", "")).strip(),
                "source_evidence": str(item.get("source_evidence", "")).strip(),
                "answer": str(item.get("answer_text", "")).strip(),
            }
        )

    for item in _safe_get_list(sections, "section_b_fill_blanks"):
        units.append(
            {
                "section": "section_b_fill_blanks",
                "question": str(item.get("question", "")).strip(),
                "difficulty": str(item.get("difficulty", "")).strip(),
                "bloom": str(item.get("bloom_level", "")).strip(),
                "question_type": str(item.get("question_type", "")).strip(),
                "source_evidence": str(item.get("source_evidence", "")).strip(),
                "answer": str(item.get("answer", "")).strip(),
            }
        )

    for key in ["section_c_short_answers", "section_d_long_answers", "section_e_application"]:
        for item in _safe_get_list(sections, key):
            units.append(
                {
                    "section": key,
                    "question": str(item.get("question", "")).strip(),
                    "difficulty": str(item.get("difficulty", "")).strip(),
                    "bloom": str(item.get("bloom_level", "")).strip(),
                    "question_type": str(item.get("question_type", "")).strip(),
                    "source_evidence": str(item.get("source_evidence", "")).strip(),
                    "answer": str(item.get("answer_guidance", "")).strip(),
                }
            )

    for case in _safe_get_list(sections, "section_f_case_studies"):
        case_scenario = str(case.get("scenario", "")).strip()
        for item in _safe_get_list(case, "questions"):
            units.append(
                {
                    "section": "section_f_case_studies",
                    "question": str(item.get("question", "")).strip() or case_scenario,
                    "difficulty": str(item.get("difficulty", "")).strip(),
                    "bloom": str(item.get("bloom_level", "")).strip(),
                    "question_type": str(item.get("question_type", "")).strip(),
                    "source_evidence": str(item.get("source_evidence", "")).strip(),
                    "answer": str(item.get("answer_guidance", "")).strip(),
                }
            )

    return units


def validate_worksheet(
    worksheet: dict[str, Any],
    retrieved_context: str = "",
    expected_targets: dict[str, dict[str, int]] | None = None,
) -> dict[str, Any]:
    """Validate worksheet quality and distribution constraints for classroom readiness."""
    issues: list[str] = []

    sections = worksheet.get("sections", {})

    # Section count checks
    section_counts = {
        "section_a_mcqs": len(_safe_get_list(sections, "section_a_mcqs")),
        "section_b_fill_blanks": len(_safe_get_list(sections, "section_b_fill_blanks")),
        "section_c_short_answers": len(_safe_get_list(sections, "section_c_short_answers")),
        "section_d_long_answers": len(_safe_get_list(sections, "section_d_long_answers")),
        "section_e_application": len(_safe_get_list(sections, "section_e_application")),
        "section_f_case_studies": len(_safe_get_list(sections, "section_f_case_studies")),
    }

    for section_name, expected in SECTION_COUNTS.items():
        if section_counts[section_name] != expected:
            issues.append(
                f"{section_name} count mismatch: expected {expected}, got {section_counts[section_name]}"
            )

    # Case study shape check
    for idx, case in enumerate(_safe_get_list(sections, "section_f_case_studies"), start=1):
        q_count = len(_safe_get_list(case, "questions"))
        if q_count != CASE_STUDY_QUESTIONS_PER_CASE:
            issues.append(
                f"section_f_case_studies case {idx} must have {CASE_STUDY_QUESTIONS_PER_CASE} questions, got {q_count}"
            )

    units = _collect_question_units(worksheet)
    if len(units) != TOTAL_QUESTION_UNITS:
        issues.append(
            f"Total question units mismatch: expected {TOTAL_QUESTION_UNITS}, got {len(units)}"
        )

    # Duplicate/reworded duplicate checks
    normalized_questions = [_norm(u["question"]) for u in units if u["question"]]
    if len(set(normalized_questions)) != len(normalized_questions):
        issues.append("Duplicate questions detected")

    near_duplicates = 0
    for i in range(len(units)):
        for j in range(i + 1, len(units)):
            if _near_duplicate_ratio(units[i]["question"], units[j]["question"]) >= 0.88:
                near_duplicates += 1
    if near_duplicates:
        issues.append(f"Reworded duplicate questions detected: {near_duplicates}")

    # Same-answer check for MCQs
    mcq_answers = [
        _norm(str(item.get("answer_text", "")))
        for item in _safe_get_list(sections, "section_a_mcqs")
        if str(item.get("answer_text", "")).strip()
    ]
    if len(set(mcq_answers)) != len(mcq_answers):
        issues.append("Same-answer repetition detected in MCQ section")

    # Metadata checks + stats
    difficulty_counter: Counter[str] = Counter()
    bloom_counter: Counter[str] = Counter()
    question_type_counter: Counter[str] = Counter()

    context_norm = _norm(retrieved_context)
    for idx, unit in enumerate(units, start=1):
        difficulty = _canonicalize(unit["difficulty"], DIFFICULTY_CANONICAL)
        bloom = _canonicalize(unit["bloom"], BLOOM_CANONICAL)
        q_type = _canonicalize(unit["question_type"], QUESTION_TYPE_CANONICAL)

        if not unit["question"]:
            issues.append(f"Q{idx}: missing question text")

        if not difficulty:
            issues.append(f"Q{idx}: invalid difficulty label")
        else:
            difficulty_counter[difficulty] += 1

        if not bloom:
            issues.append(f"Q{idx}: invalid bloom level")
        else:
            bloom_counter[bloom] += 1

        if not q_type:
            issues.append(f"Q{idx}: invalid question type")
        else:
            question_type_counter[q_type] += 1

        evidence = unit["source_evidence"]
        if not evidence:
            issues.append(f"Q{idx}: missing source_evidence")
        elif context_norm and _norm(evidence) not in context_norm:
            issues.append(f"Q{idx}: source_evidence not grounded in retrieved context")

    targets = expected_targets or build_distribution_targets(TOTAL_QUESTION_UNITS)

    for label, expected in targets["difficulty"].items():
        if difficulty_counter[label] != expected:
            issues.append(
                f"Difficulty distribution mismatch for {label}: expected {expected}, got {difficulty_counter[label]}"
            )

    for label, expected in targets["bloom"].items():
        if bloom_counter[label] != expected:
            issues.append(
                f"Bloom distribution mismatch for {label}: expected {expected}, got {bloom_counter[label]}"
            )

    for label, expected in targets["question_type"].items():
        if question_type_counter[label] != expected:
            issues.append(
                f"Question type distribution mismatch for {label}: expected {expected}, got {question_type_counter[label]}"
            )

    app_required = int(math.ceil(TOTAL_QUESTION_UNITS * 0.25))
    scenario_required = int(math.ceil(TOTAL_QUESTION_UNITS * 0.15))
    hot_required = int(math.ceil(TOTAL_QUESTION_UNITS * 0.15))

    if question_type_counter["Application-Based"] < app_required:
        issues.append(
            f"Application-based minimum not met: need {app_required}, got {question_type_counter['Application-Based']}"
        )
    if question_type_counter["Scenario-Based"] < scenario_required:
        issues.append(
            f"Scenario-based minimum not met: need {scenario_required}, got {question_type_counter['Scenario-Based']}"
        )
    if question_type_counter["Higher Order Thinking"] < hot_required:
        issues.append(
            f"Higher-order minimum not met: need {hot_required}, got {question_type_counter['Higher Order Thinking']}"
        )

    # Quality score: deduct weighted points, clamp [0, 100]
    score = 100
    for issue in issues:
        if "missing" in issue.lower() or "invalid" in issue.lower():
            score -= 5
        elif "mismatch" in issue.lower():
            score -= 4
        elif "duplicate" in issue.lower():
            score -= 8
        else:
            score -= 3
    score = max(0, score)

    return {
        "valid": len(issues) == 0,
        "quality_score": score,
        "difficulty_stats": dict(difficulty_counter),
        "bloom_stats": dict(bloom_counter),
        "question_type_stats": dict(question_type_counter),
        "section_counts": section_counts,
        "issues": issues,
    }
