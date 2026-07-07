"""Extract structured questions from raw exam paper text."""

from __future__ import annotations

import json
import re
from typing import Any

from app.core.llm import get_model
from app.educational_ai.question_paper.prompts import build_extraction_prompt


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
        text = text[start_arr : text.rfind("]") + 1]
    else:
        text = text[start_obj : text.rfind("}") + 1]
    return json.loads(text)


def extract_questions_from_text(
    raw_text: str,
    class_level: str,
    subject: str,
    max_attempts: int = 3,
) -> dict[str, Any]:
    """
    Parse raw exam paper text into structured questions using LLM.

    Returns dict with keys: total_marks, duration, sections, questions.
    """
    model = get_model("pro")
    prompt = build_extraction_prompt(class_level, subject, raw_text)

    issues: list[str] = []
    last_error: Exception | None = None

    for attempt in range(max_attempts):
        try:
            full_prompt = prompt
            if issues:
                full_prompt = (
                    prompt
                    + "\n\nPrevious issues found:\n"
                    + "\n".join(f"- {i}" for i in issues)
                )

            response = model.generate_content(full_prompt)
            result = _extract_json(response.text or "")

            # Validate basic structure
            questions = result.get("questions", [])
            if not questions:
                issues.append("No questions were extracted. Please try again.")
                continue

            # Ensure each question has required fields
            for q in questions:
                q.setdefault("question_number", "")
                q.setdefault("question_text", "")
                q.setdefault("marks", 1)
                q.setdefault("section", "")
                q.setdefault("has_internal_choice", False)
                q.setdefault("optional_part", None)
                q.setdefault("chapter_hint", "")
                q.setdefault("diagram_reference", None)
                # Ensure marks is int
                try:
                    q["marks"] = int(q["marks"])
                except (ValueError, TypeError):
                    q["marks"] = 1

            return {
                "total_marks": result.get("total_marks", sum(q["marks"] for q in questions)),
                "duration": result.get("duration", ""),
                "sections": result.get("sections", []),
                "questions": questions,
            }

        except (json.JSONDecodeError, ValueError) as e:
            last_error = e
            issues.append(f"JSON parse error: {e}")

    raise ValueError(
        f"Failed to extract questions after {max_attempts} attempts: {last_error}"
    )
