from __future__ import annotations

import math
import re
from collections import Counter
from typing import Any


VALID_TYPES = {
    "mcq",
    "short_answer",
    "long_answer",
    "application",
    "case-based",
    "scenario-based",
}

VALID_DIFFICULTIES = {"easy", "medium", "hard"}
VALID_BLOOM = {"remember", "understand", "apply", "analyze", "evaluate", "create"}


def _norm(text: str) -> str:
    return re.sub(r"\s+", " ", text.strip().lower())


def _allocate_counts(total: int, ratios: dict[str, float]) -> dict[str, int]:
    raw = {k: total * v for k, v in ratios.items()}
    base = {k: int(math.floor(v)) for k, v in raw.items()}
    remainder = total - sum(base.values())
    order = sorted(raw.items(), key=lambda kv: kv[1] - base[kv[0]], reverse=True)
    for i in range(remainder):
        base[order[i % len(order)][0]] += 1
    return base


def validate_question_bank(
    questions: list[dict[str, Any]],
    retrieved_context: str,
    total_questions: int,
) -> dict[str, Any]:
    """Validate duplicates, distributions, metadata quality, and grounding."""
    issues: list[str] = []

    if len(questions) != total_questions:
        issues.append(f"Question count mismatch: expected {total_questions}, got {len(questions)}")

    difficulty_counter: Counter[str] = Counter()
    bloom_counter: Counter[str] = Counter()
    type_counter: Counter[str] = Counter()

    q_texts: list[str] = []
    concepts: list[str] = []
    answers: list[str] = []

    context_norm = _norm(retrieved_context)

    for idx, item in enumerate(questions, start=1):
        question = str(item.get("question", "")).strip()
        qtype = _norm(str(item.get("type", "")))
        difficulty = _norm(str(item.get("difficulty", "")))
        bloom = _norm(str(item.get("bloom", "")))
        chapter = str(item.get("chapter", "")).strip()
        book_id = str(item.get("book_id", "")).strip()
        source_evidence = str(item.get("source_evidence", "")).strip()

        if not question:
            issues.append(f"Q{idx}: missing question text")
        else:
            q_texts.append(_norm(question))

        if qtype not in VALID_TYPES:
            issues.append(f"Q{idx}: invalid type '{qtype}'")
        else:
            type_counter[qtype] += 1

        if difficulty not in VALID_DIFFICULTIES:
            issues.append(f"Q{idx}: invalid difficulty '{difficulty}'")
        else:
            difficulty_counter[difficulty] += 1

        if bloom not in VALID_BLOOM:
            issues.append(f"Q{idx}: invalid bloom '{bloom}'")
        else:
            bloom_counter[bloom] += 1

        if not chapter:
            issues.append(f"Q{idx}: missing chapter")

        if not book_id:
            issues.append(f"Q{idx}: missing book_id")

        if not source_evidence:
            issues.append(f"Q{idx}: missing source_evidence")
        elif context_norm and _norm(source_evidence) not in context_norm:
            issues.append(f"Q{idx}: source_evidence not found in retrieved context")

        concept = _norm(str(item.get("concept", "")))
        if concept:
            concepts.append(concept)

        answer = _norm(str(item.get("answer", "")))
        if answer:
            answers.append(answer)

    if len(set(q_texts)) != len(q_texts):
        issues.append("Duplicate or reworded duplicate questions detected")

    if concepts and len(set(concepts)) != len(concepts):
        issues.append("Duplicate concepts detected")

    if answers and len(set(answers)) != len(answers):
        issues.append("Duplicate answers detected")

    diff_target = _allocate_counts(total_questions, {"easy": 0.20, "medium": 0.50, "hard": 0.30})
    bloom_target = _allocate_counts(
        total_questions,
        {
            "remember": 0.20,
            "understand": 0.25,
            "apply": 0.25,
            "analyze": 0.15,
            "evaluate": 0.10,
            "create": 0.05,
        },
    )

    for label, expected in diff_target.items():
        if difficulty_counter[label] != expected:
            issues.append(
                f"Difficulty distribution mismatch for {label}: expected {expected}, got {difficulty_counter[label]}"
            )

    for label, expected in bloom_target.items():
        if bloom_counter[label] != expected:
            issues.append(
                f"Bloom distribution mismatch for {label}: expected {expected}, got {bloom_counter[label]}"
            )

    app_min = int(math.ceil(total_questions * 0.25))
    scenario_min = int(math.ceil(total_questions * 0.15))
    if type_counter["application"] < app_min:
        issues.append(
            f"Application minimum not met: need {app_min}, got {type_counter['application']}"
        )
    if type_counter["scenario-based"] < scenario_min:
        issues.append(
            f"Scenario minimum not met: need {scenario_min}, got {type_counter['scenario-based']}"
        )

    score = 100
    for issue in issues:
        if "missing" in issue.lower() or "invalid" in issue.lower():
            score -= 4
        elif "distribution" in issue.lower() or "minimum" in issue.lower():
            score -= 5
        elif "duplicate" in issue.lower():
            score -= 6
        else:
            score -= 3

    return {
        "valid": len(issues) == 0,
        "quality_score": max(0, score),
        "difficulty_stats": dict(difficulty_counter),
        "bloom_stats": dict(bloom_counter),
        "question_type_stats": dict(type_counter),
        "issues": issues,
    }
