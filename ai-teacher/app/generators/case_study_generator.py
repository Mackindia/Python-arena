from __future__ import annotations

import json
import math
import re
from typing import Any

from app.core.llm import get_model
from app.retrieval.retriever import retrieve_context
from app.validators.case_study_validator import validate_case_studies


def _allocate_counts(total: int, ratios: dict[str, float]) -> dict[str, int]:
    raw = {k: total * v for k, v in ratios.items()}
    base = {k: int(math.floor(v)) for k, v in raw.items()}
    rem = total - sum(base.values())
    order = sorted(raw.items(), key=lambda kv: kv[1] - base[kv[0]], reverse=True)
    for i in range(rem):
        base[order[i % len(order)][0]] += 1
    return base


def _extract_json_array(raw_text: str) -> list[dict[str, Any]]:
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
        raise ValueError("Case study response is not a JSON array")
    return parsed


def _build_prompt(
    topic: str,
    num_cases: int,
    context: str,
    difficulty_targets: dict[str, int],
    attempt: int,
    previous_issues: list[str] | None,
) -> str:
    retry = ""
    if attempt > 1 and previous_issues:
        retry = "\nFix all validation failures below and regenerate completely:\n" + "\n".join(
            f"- {i}" for i in previous_issues[:20]
        )

    return f"""
You are an educational case-study designer for school AI education.

Generate exactly {num_cases} high-quality case studies for topic: {topic}.
{retry}
Mandatory requirements:
- Each scenario must be 150-300 words.
- Each case must include: realistic scenario, context, decision_making_situation, multiple perspectives.
- Avoid generic stories, repetition, and direct textbook copy-paste.
- Use school, student, real-life, technology, and ethical contexts.
- Strictly grounded in provided source context.

Difficulty distribution (exact counts):
- Easy: {difficulty_targets['Easy']}
- Medium: {difficulty_targets['Medium']}
- Hard: {difficulty_targets['Hard']}

Each case must include 4 questions in this exact order and type labels:
1) Application-Based
2) Analytical
3) Decision Making
4) Higher Order Thinking

No answers.

Output only JSON array with schema:
[
  {{
    "title": "string",
    "scenario": "150-300 words",
    "context": "string",
    "decision_making_situation": "string",
    "perspectives": ["string", "string", "..."],
    "difficulty": "Easy|Medium|Hard",
    "source_evidence": "exact short phrase from context",
    "questions": [
      {{"question_type": "Application-Based", "question": "string"}},
      {{"question_type": "Analytical", "question": "string"}},
      {{"question_type": "Decision Making", "question": "string"}},
      {{"question_type": "Higher Order Thinking", "question": "string"}}
    ]
  }}
]

Source context:
{context}
"""


def generate_case_studies(
    topic: str,
    num_cases: int = 5,
    book_id: str | None = None,
) -> dict[str, Any]:
    retrieval = retrieve_context(query=topic, book_id=book_id, k=14, search_type="mmr")
    context = retrieval["context"]

    if not context.strip():
        raise ValueError("No retrieved context available for case study generation.")

    model = get_model("pro")
    targets = _allocate_counts(num_cases, {"Easy": 0.20, "Medium": 0.50, "Hard": 0.30})

    issues: list[str] = []
    parsed: list[dict[str, Any]] = []
    validation: dict[str, Any] = {"valid": False, "issues": []}

    for attempt in range(1, 4):
        prompt = _build_prompt(
            topic=topic,
            num_cases=num_cases,
            context=context,
            difficulty_targets=targets,
            attempt=attempt,
            previous_issues=issues,
        )

        response = model.generate_content(prompt)
        raw = response.text or ""

        try:
            parsed = _extract_json_array(raw)
        except Exception as ex:
            issues = [f"JSON parse error: {ex}"]
            continue

        validation = validate_case_studies(
            cases=parsed,
            retrieved_context=context,
            expected_count=num_cases,
        )

        if validation.get("valid"):
            return {
                "topic": topic,
                "book_id": book_id,
                "num_cases": num_cases,
                "difficulty_distribution": validation.get("difficulty_stats", {}),
                "quality_score": validation.get("quality_score", 0),
                "validation_passed": True,
                "case_studies": parsed,
                "retrieval": {
                    "sources": retrieval["sources"],
                    "context_preview": context[:1200],
                },
            }

        issues = validation.get("issues", [])

    raise ValueError(
        "Case study generation failed validation after 3 attempts. "
        f"Issues: {', '.join(issues[:10])}"
    )
