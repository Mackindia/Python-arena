"""Pattern-based question paper generator."""

from __future__ import annotations

import json
import re
from typing import Any

from app.core.llm import get_model
from app.educational_ai.question_paper.prompts import (
    build_generate_answers_prompt,
    build_generate_paper_prompt,
)
from app.educational_ai.question_paper.solver import _word_count, _estimate_difficulty
from app.educational_ai.retrieval.engine import search


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


def generate_paper(
    class_level: str,
    subject: str,
    topic: str,
    total_marks: int = 80,
    sections: list[dict] | None = None,
    topic_distribution: dict[str, float] | None = None,
    difficulty_distribution: dict[str, float] | None = None,
    book_id: str | None = None,
    existing_questions: list[str] | None = None,
    difficulty_profile: str | None = None,
    use_cbse_pattern: bool = False,
) -> dict[str, Any]:
    """
    Generate a complete question paper following a pattern.

    Args:
        class_level: e.g. "Class 10"
        subject: e.g. "Biology"
        topic: e.g. "Genetics and Evolution"
        total_marks: total marks for the paper
        sections: list of section specs [{name, mark_type, count, required, internal_choice}]
        topic_distribution: {topic_name: percentage}
        difficulty_distribution: {"Easy": %, "Medium": %, "Hard": %}
        book_id: optional book to retrieve context from
        existing_questions: questions to avoid repeating
        difficulty_profile: predefined profile name (cbse_board, cbse_unit_test, etc.)
        use_cbse_pattern: use CBSE standard section structure

    Returns: dict with paper_info, questions, and validation.
    """
    from app.educational_ai.question_paper.schemas import (
        CBSE_DIFFICULTY_PROFILES,
        CBSE_SECTION_PATTERNS,
    )

    # Apply CBSE difficulty profile
    if difficulty_profile and difficulty_profile in CBSE_DIFFICULTY_PROFILES:
        difficulty_distribution = CBSE_DIFFICULTY_PROFILES[difficulty_profile]
    elif difficulty_profile:
        raise ValueError(
            f"Unknown difficulty profile: {difficulty_profile}. "
            f"Available: {', '.join(CBSE_DIFFICULTY_PROFILES.keys())}"
        )

    # Apply CBSE section pattern
    if use_cbse_pattern and not sections:
        pattern_key = f"cbse_{total_marks}" if f"cbse_{total_marks}" in CBSE_SECTION_PATTERNS else "cbse_80"
        sections = CBSE_SECTION_PATTERNS[pattern_key]
    elif not sections:
        sections = _default_sections(total_marks)

    # Retrieve context from book library
    search_query = f"{topic} {subject} exam questions"
    context_result = search(
        query=search_query,
        class_level=class_level,
        subject=subject,
        book_id=book_id,
        k=20,
    )
    context = context_result["context"]

    model = get_model("fast")
    prompt = build_generate_paper_prompt(
        class_level=class_level,
        subject=subject,
        topic=topic,
        total_marks=total_marks,
        sections=sections,
        topic_distribution=topic_distribution,
        difficulty_distribution=difficulty_distribution,
        existing_questions=existing_questions or [],
        context=context,
        cbse_mode=use_cbse_pattern or (difficulty_profile is not None),
    )

    issues: list[str] = []
    for attempt in range(3):
        try:
            full_prompt = prompt
            if issues:
                full_prompt = (
                    prompt
                    + "\n\nPrevious issues:\n"
                    + "\n".join(f"- {i}" for i in issues)
                )

            response = model.generate_content(full_prompt)
            result = _extract_json(response.text or "")

            # Validate structure
            generated_sections = result.get("sections", [])
            if not generated_sections:
                issues.append("No sections in generated paper")
                continue

            # Flatten questions and build response
            all_questions = []
            paper_sections = []
            for sec in generated_sections:
                sec_name = sec.get("name", "?")
                mark_type = sec.get("mark_type", 1)
                questions = sec.get("questions", [])

                for q in questions:
                    q.setdefault("question_number", "")
                    q.setdefault("question_text", "")
                    q.setdefault("marks", mark_type)
                    q.setdefault("section", sec_name)
                    q.setdefault("has_internal_choice", False)
                    q.setdefault("optional_part", None)
                    q.setdefault("chapter_hint", "")
                    q.setdefault("difficulty", "Medium")
                    all_questions.append(q)

                paper_sections.append({
                    "name": sec_name,
                    "mark_type": mark_type,
                    "count": len(questions),
                })

            actual_total = sum(q.get("marks", 0) for q in all_questions)
            return {
                "paper_info": {
                    "total_marks": actual_total,
                    "duration": f"{max(1, actual_total // 20)} hours",
                    "sections": paper_sections,
                },
                "questions": all_questions,
                "generated_count": len(all_questions),
                "actual_total_marks": actual_total,
            }

        except (json.JSONDecodeError, ValueError) as e:
            issues.append(f"Parse error: {e}")

    raise ValueError(f"Paper generation failed after 3 attempts: {issues[:5]}")


def generate_with_answers(
    class_level: str,
    subject: str,
    topic: str,
    total_marks: int = 80,
    sections: list[dict] | None = None,
    topic_distribution: dict[str, float] | None = None,
    difficulty_distribution: dict[str, float] | None = None,
    book_id: str | None = None,
    difficulty_profile: str | None = None,
    use_cbse_pattern: bool = False,
) -> dict[str, Any]:
    """Generate a paper AND its answer key."""
    paper = generate_paper(
        class_level=class_level,
        subject=subject,
        topic=topic,
        total_marks=total_marks,
        sections=sections,
        topic_distribution=topic_distribution,
        difficulty_distribution=difficulty_distribution,
        book_id=book_id,
        difficulty_profile=difficulty_profile,
        use_cbse_pattern=use_cbse_pattern,
    )

    # Generate answers for all questions
    questions = paper["questions"]
    search_query = " ".join(q.get("question_text", "") for q in questions)[:500]
    context_result = search(
        query=search_query,
        class_level=class_level,
        subject=subject,
        book_id=book_id,
        k=20,
    )
    context = context_result["context"]

    model = get_model("fast")
    prompt = build_generate_answers_prompt(
        questions=questions,
        class_level=class_level,
        subject=subject,
        context=context,
    )

    try:
        response = model.generate_content(prompt)
        answers_raw = _extract_json(response.text or "")

        answers = []
        if isinstance(answers_raw, list):
            for ans in answers_raw:
                answers.append({
                    "question_number": ans.get("question_number", ""),
                    "question_text": ans.get("question_text", ""),
                    "marks": ans.get("marks", 1),
                    "section": "",
                    "chapter": "",
                    "difficulty": _estimate_difficulty(ans.get("marks", 1), ""),
                    "bloom_level": "",
                    "repeat_likelihood": "",
                    "answer": {
                        "direct_answer": ans.get("direct_answer", ""),
                        "key_points": ans.get("key_points", []),
                        "common_mistakes": ans.get("common_mistakes", []),
                        "exam_tips": ans.get("exam_tips", ""),
                        "word_count": _word_count(ans.get("direct_answer", "")),
                    },
                })
        paper["answers"] = answers
    except Exception:
        paper["answers"] = None

    return paper


def _default_sections(total_marks: int) -> list[dict]:
    """Create default section structure based on total marks."""
    if total_marks <= 40:
        return [
            {"name": "A", "mark_type": 1, "count": 10, "required": 10, "internal_choice": False},
            {"name": "B", "mark_type": 2, "count": 5, "required": 4, "internal_choice": False},
            {"name": "C", "mark_type": 3, "count": 3, "required": 2, "internal_choice": False},
            {"name": "D", "mark_type": 5, "count": 1, "required": 1, "internal_choice": False},
        ]
    if total_marks <= 80:
        return [
            {"name": "A", "mark_type": 1, "count": 20, "required": 20, "internal_choice": False},
            {"name": "B", "mark_type": 2, "count": 8, "required": 5, "internal_choice": False},
            {"name": "C", "mark_type": 3, "count": 6, "required": 4, "internal_choice": False},
            {"name": "D", "mark_type": 5, "count": 3, "required": 2, "internal_choice": True},
        ]
    # 100+ marks
    return [
        {"name": "A", "mark_type": 1, "count": 25, "required": 25, "internal_choice": False},
        {"name": "B", "mark_type": 2, "count": 10, "required": 7, "internal_choice": False},
        {"name": "C", "mark_type": 3, "count": 8, "required": 5, "internal_choice": False},
        {"name": "D", "mark_type": 5, "count": 4, "required": 3, "internal_choice": True},
    ]
