from __future__ import annotations

import json
import re
from typing import Any

from app.core.llm import get_model
from app.educational_ai.prompts.educational_prompts import (
    build_bloom_prompt,
    build_concept_map_prompt,
    build_lesson_plan_prompt,
    build_mcq_prompt,
    build_notes_prompt,
    build_question_bank_prompt,
    build_worksheet_prompt,
)
from app.educational_ai.retrieval.engine import search
from app.educational_ai.validation.engine import (
    validate_coverage,
    validate_mcq_payload,
    validate_text_grounding,
)


def _extract_json(raw_text: str) -> Any:
    text = raw_text.strip()
    fenced = re.search(r"```(?:json)?\s*(.*?)\s*```", text, flags=re.DOTALL)
    if fenced:
        text = fenced.group(1).strip()
    start_obj = text.find("{")
    start_arr = text.find("[")
    if start_obj == -1 and start_arr == -1:
        raise ValueError("Model output did not include JSON")
    if start_arr != -1 and (start_arr < start_obj or start_obj == -1):
        text = text[start_arr:text.rfind("]") + 1]
    else:
        text = text[start_obj:text.rfind("}") + 1]
    return json.loads(text)


def _generate_with_retry(prompt: str, context: str, validator, max_attempts: int = 3) -> Any:
    model = get_model("fast")
    issues: list[str] = []

    for _ in range(max_attempts):
        response = model.generate_content(prompt if not issues else f"{prompt}\n\nPrevious issues:\n" + "\n".join(f"- {i}" for i in issues))
        payload = _extract_json(response.text or "")
        validation = validator(payload, context)
        if validation.get("valid"):
            return payload, validation
        issues = validation.get("issues", [])

    raise ValueError(f"Generation failed quality validation: {issues[:10]}")


def generate_notes(class_level: str, subject: str, topic: str, book_id: str | None = None) -> dict[str, Any]:
    context_result = search(query=topic, class_level=class_level, subject=subject, book_id=book_id, k=12)
    context = context_result["context"]
    prompt = build_notes_prompt(topic, class_level, subject, context)
    payload, _ = _generate_with_retry(
        prompt,
        context,
        lambda output, ctx: {"valid": bool(output.get("summary")), "issues": validate_text_grounding(json.dumps(output), ctx)},
    )
    return payload


def generate_mcq(class_level: str, subject: str, topic: str, difficulty: str = "medium", count: int = 10, book_id: str | None = None) -> dict[str, Any]:
    context_result = search(query=topic, class_level=class_level, subject=subject, book_id=book_id, k=max(10, count * 2))
    context = context_result["context"]
    prompt = build_mcq_prompt(topic, class_level, subject, difficulty, count, context)
    payload, validation = _generate_with_retry(
        prompt,
        context,
        lambda output, ctx: validate_mcq_payload(output if isinstance(output, list) else output.get("questions", []), ctx, count),
    )
    return {
        "questions": payload if isinstance(payload, list) else payload.get("questions", []),
        "validation": validation,
    }


def generate_question_bank(class_level: str, subject: str, topic: str, count: int = 100, book_id: str | None = None) -> dict[str, Any]:
    context_result = search(query=topic, class_level=class_level, subject=subject, book_id=book_id, k=20)
    context = context_result["context"]
    prompt = build_question_bank_prompt(topic, class_level, subject, count, context)
    payload, validation = _generate_with_retry(
        prompt,
        context,
        lambda output, ctx: {"valid": len(output) > 0, "issues": validate_coverage(output, ["question", "type", "difficulty", "bloom", "answer", "source_evidence"]) + validate_text_grounding(json.dumps(output), ctx)},
    )
    return {"questions": payload, "validation": validation}


def generate_worksheet(class_level: str, subject: str, topic: str, book_id: str | None = None) -> dict[str, Any]:
    context_result = search(query=topic, class_level=class_level, subject=subject, book_id=book_id, k=20)
    context = context_result["context"]
    prompt = build_worksheet_prompt(topic, class_level, subject, context)
    payload, validation = _generate_with_retry(
        prompt,
        context,
        lambda output, ctx: {"valid": bool(output), "issues": validate_text_grounding(json.dumps(output), ctx)},
    )
    return {"worksheet": payload, "validation": validation}


def generate_lesson_plan(class_level: str, subject: str, topic: str, duration_minutes: int = 45, book_id: str | None = None) -> dict[str, Any]:
    context_result = search(query=topic, class_level=class_level, subject=subject, book_id=book_id, k=20)
    context = context_result["context"]
    prompt = build_lesson_plan_prompt(topic, class_level, subject, duration_minutes, context)
    payload, validation = _generate_with_retry(
        prompt,
        context,
        lambda output, ctx: {
            "valid": bool(output.get("lesson_structure")),
            "issues": validate_text_grounding(json.dumps(output), ctx),
        },
    )
    return {"lesson_plan": payload, "validation": validation}


def generate_bloom_analysis(class_level: str, subject: str, topic: str, book_id: str | None = None) -> dict[str, Any]:
    context_result = search(query=topic, class_level=class_level, subject=subject, book_id=book_id, k=20)
    context = context_result["context"]
    prompt = build_bloom_prompt(topic, class_level, subject, context)
    payload, validation = _generate_with_retry(
        prompt,
        context,
        lambda output, ctx: {
            "valid": bool(output.get("bloom_analysis")),
            "issues": validate_text_grounding(json.dumps(output), ctx),
        },
    )
    return {"bloom_analysis": payload, "validation": validation}


def generate_concept_map(class_level: str, subject: str, topic: str, book_id: str | None = None) -> dict[str, Any]:
    context_result = search(query=topic, class_level=class_level, subject=subject, book_id=book_id, k=20)
    context = context_result["context"]
    prompt = build_concept_map_prompt(topic, class_level, subject, context)
    payload, validation = _generate_with_retry(
        prompt,
        context,
        lambda output, ctx: {
            "valid": bool(output.get("nodes")),
            "issues": validate_text_grounding(json.dumps(output), ctx),
        },
    )
    return {"concept_map": payload, "validation": validation}
