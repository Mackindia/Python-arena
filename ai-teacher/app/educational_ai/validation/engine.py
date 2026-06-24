from __future__ import annotations

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
