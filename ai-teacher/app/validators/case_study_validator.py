from __future__ import annotations

import math
import re
from collections import Counter
from typing import Any


def _norm(text: str) -> str:
    return re.sub(r"\s+", " ", text.strip().lower())


def _allocate_counts(total: int, ratios: dict[str, float]) -> dict[str, int]:
    raw = {k: total * v for k, v in ratios.items()}
    base = {k: int(math.floor(v)) for k, v in raw.items()}
    rem = total - sum(base.values())
    order = sorted(raw.items(), key=lambda kv: kv[1] - base[kv[0]], reverse=True)
    for i in range(rem):
        base[order[i % len(order)][0]] += 1
    return base


def validate_case_studies(
    cases: list[dict[str, Any]],
    retrieved_context: str,
    expected_count: int,
) -> dict[str, Any]:
    """Validate structure, quality, difficulty mix, and grounding for case studies."""
    issues: list[str] = []
    difficulty_counter: Counter[str] = Counter()

    if len(cases) != expected_count:
        issues.append(f"Case count mismatch: expected {expected_count}, got {len(cases)}")

    context_norm = _norm(retrieved_context)
    scenario_norms: list[str] = []

    for idx, case in enumerate(cases, start=1):
        scenario = str(case.get("scenario", "")).strip()
        context = str(case.get("context", "")).strip()
        decision = str(case.get("decision_making_situation", "")).strip()
        perspectives = case.get("perspectives", [])
        difficulty = str(case.get("difficulty", "")).strip().title()
        source_evidence = str(case.get("source_evidence", "")).strip()
        questions = case.get("questions", [])

        if not scenario:
            issues.append(f"Case {idx}: missing scenario")
        else:
            wc = len(scenario.split())
            if wc < 150 or wc > 300:
                issues.append(f"Case {idx}: scenario length must be 150-300 words, got {wc}")
            scenario_norms.append(_norm(scenario))

        if not context:
            issues.append(f"Case {idx}: missing context")

        if not decision:
            issues.append(f"Case {idx}: missing decision-making situation")

        if not isinstance(perspectives, list) or len(perspectives) < 2:
            issues.append(f"Case {idx}: perspectives must include at least 2 viewpoints")

        if difficulty not in {"Easy", "Medium", "Hard"}:
            issues.append(f"Case {idx}: invalid difficulty '{difficulty}'")
        else:
            difficulty_counter[difficulty] += 1

        if not source_evidence:
            issues.append(f"Case {idx}: missing source_evidence")
        elif context_norm and _norm(source_evidence) not in context_norm:
            issues.append(f"Case {idx}: source_evidence not found in retrieved context")

        if not isinstance(questions, list) or len(questions) != 4:
            issues.append(f"Case {idx}: must contain exactly 4 questions")
        else:
            required_order = [
                "Application-Based",
                "Analytical",
                "Decision Making",
                "Higher Order Thinking",
            ]
            for q_idx, expected_type in enumerate(required_order, start=1):
                q = questions[q_idx - 1]
                q_text = str(q.get("question", "")).strip()
                q_type = str(q.get("question_type", "")).strip()

                if not q_text:
                    issues.append(f"Case {idx} Q{q_idx}: missing question text")

                if q_type != expected_type:
                    issues.append(
                        f"Case {idx} Q{q_idx}: expected question_type '{expected_type}', got '{q_type}'"
                    )

                # Explicitly ensure no answers are present.
                if "answer" in q:
                    issues.append(f"Case {idx} Q{q_idx}: answers are not allowed")

    if len(set(scenario_norms)) != len(scenario_norms):
        issues.append("Duplicate or reworded duplicate scenarios detected")

    expected_difficulty = _allocate_counts(expected_count, {"Easy": 0.20, "Medium": 0.50, "Hard": 0.30})
    for label, expected in expected_difficulty.items():
        if difficulty_counter[label] != expected:
            issues.append(
                f"Difficulty distribution mismatch for {label}: expected {expected}, got {difficulty_counter[label]}"
            )

    score = 100
    for issue in issues:
        if "missing" in issue.lower() or "invalid" in issue.lower():
            score -= 6
        elif "mismatch" in issue.lower():
            score -= 5
        elif "duplicate" in issue.lower():
            score -= 8
        else:
            score -= 4

    return {
        "valid": len(issues) == 0,
        "quality_score": max(0, score),
        "difficulty_stats": dict(difficulty_counter),
        "issues": issues,
    }
