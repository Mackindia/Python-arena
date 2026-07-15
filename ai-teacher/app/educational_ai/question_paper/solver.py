"""Mark-appropriate answer generation for exam questions."""

from __future__ import annotations

import json
import re
from typing import Any

from app.core.llm import get_model
from app.educational_ai.question_paper.prompts import (
    build_generate_answers_prompt,
    build_solve_prompt,
)
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


def _word_count(text: str) -> int:
    return len(text.split())


def _estimate_difficulty(marks: int, bloom_level: str) -> str:
    if marks <= 2:
        return "Easy"
    if marks <= 3:
        return "Medium"
    return "Hard"


def solve_single_question(
    question: dict,
    class_level: str,
    subject: str,
    book_id: str | None = None,
) -> dict[str, Any]:
    """
    Solve a single question with a mark-appropriate answer.

    Returns a dict with question info + answer content.
    """
    question_text = question.get("question_text", "")
    marks = question.get("marks", 1)
    diagram_ref = question.get("diagram_reference")

    # Retrieve context for this question
    search_query = f"{question_text} {question.get('chapter_hint', '')}"
    context_result = search(
        query=search_query,
        class_level=class_level,
        subject=subject,
        book_id=book_id,
        k=max(6, marks * 2),
    )
    context = context_result["context"]

    model = get_model("fast")
    prompt = build_solve_prompt(
        question_text=question_text,
        marks=marks,
        class_level=class_level,
        subject=subject,
        context=context,
        diagram_reference=diagram_ref,
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
            answer_data = _extract_json(response.text or "")

            # Validate answer has required fields
            direct_answer = answer_data.get("direct_answer", "")
            if not direct_answer:
                issues.append("direct_answer is empty")
                continue

            wc = _word_count(direct_answer)

            return {
                "question_number": question.get("question_number", ""),
                "question_text": question_text,
                "marks": marks,
                "section": question.get("section", ""),
                "chapter": question.get("chapter_hint", ""),
                "difficulty": _estimate_difficulty(marks, ""),
                "bloom_level": "",
                "repeat_likelihood": "",
                "answer": {
                    "direct_answer": direct_answer,
                    "key_points": answer_data.get("key_points", []),
                    "common_mistakes": answer_data.get("common_mistakes", []),
                    "exam_tips": answer_data.get("exam_tips", ""),
                    "word_count": wc,
                },
            }

        except (json.JSONDecodeError, ValueError) as e:
            issues.append(f"Parse error: {e}")

    # Fallback: return minimal answer
    return {
        "question_number": question.get("question_number", ""),
        "question_text": question_text,
        "marks": marks,
        "section": question.get("section", ""),
        "chapter": question.get("chapter_hint", ""),
        "difficulty": _estimate_difficulty(marks, ""),
        "bloom_level": "",
        "repeat_likelihood": "",
        "answer": {
            "direct_answer": f"[Answer generation failed for this question. Please retry.]",
            "key_points": [],
            "common_mistakes": [],
            "exam_tips": "",
            "word_count": 0,
        },
    }


def solve_all_questions(
    questions: list[dict],
    class_level: str,
    subject: str,
    book_id: str | None = None,
) -> list[dict[str, Any]]:
    """Solve all questions in a paper. Returns list of solved question dicts."""
    solved = []
    for q in questions:
        try:
            result = solve_single_question(q, class_level, subject, book_id)
            solved.append(result)
        except Exception as e:
            solved.append({
                "question_number": q.get("question_number", ""),
                "question_text": q.get("question_text", ""),
                "marks": q.get("marks", 1),
                "section": q.get("section", ""),
                "chapter": q.get("chapter_hint", ""),
                "difficulty": "",
                "bloom_level": "",
                "repeat_likelihood": "",
                "answer": {
                    "direct_answer": f"[Error: {e}]",
                    "key_points": [],
                    "common_mistakes": [],
                    "exam_tips": "",
                    "word_count": 0,
                },
            })
    return solved


def generate_answer_key(
    questions: list[dict],
    class_level: str,
    subject: str,
    book_id: str | None = None,
) -> list[dict[str, Any]]:
    """
    Generate answers for all questions in batch (faster than one-by-one).
    Uses a single LLM call for the entire paper.
    """
    if not questions:
        return []

    # Retrieve context for the whole paper
    all_text = " ".join(q.get("question_text", "") for q in questions)
    search_query = all_text[:500]
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

            if isinstance(result, list) and len(result) > 0:
                answers = []
                for ans in result:
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
                return answers

            issues.append("Response was not a list of answers")

        except (json.JSONDecodeError, ValueError) as e:
            issues.append(f"Parse error: {e}")

    # Fallback to one-by-one solving
    return solve_all_questions(questions, class_level, subject, book_id)
