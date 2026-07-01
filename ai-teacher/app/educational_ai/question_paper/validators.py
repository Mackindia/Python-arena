"""Validation rules for question paper solving and generation."""

from __future__ import annotations

import re
from typing import Any

MARK_GUIDELINES = {
    1: {"min_words": 5, "max_words": 30, "min_key_points": 1},
    2: {"min_words": 20, "max_words": 70, "min_key_points": 2},
    3: {"min_words": 50, "max_words": 130, "min_key_points": 3},
    4: {"min_words": 70, "max_words": 160, "min_key_points": 4},
    5: {"min_words": 100, "max_words": 220, "min_key_points": 5},
}


def _norm(text: str) -> str:
    return re.sub(r"\s+", " ", text.strip().lower())


def validate_solved_question(q: dict) -> list[str]:
    """Validate a single solved question."""
    issues: list[str] = []
    marks = q.get("marks", 0)
    answer = q.get("answer", {})
    direct_answer = answer.get("direct_answer", "")
    key_points = answer.get("key_points", [])

    if not direct_answer or direct_answer.startswith("["):
        issues.append(f"Q{q.get('question_number', '?')}: missing or failed answer")

    if marks in MARK_GUIDELINES:
        guide = MARK_GUIDELINES[marks]
        wc = answer.get("word_count", 0)
        if wc > 0 and wc < guide["min_words"]:
            issues.append(
                f"Q{q.get('question_number', '?')}: answer too short ({wc} words, min {guide['min_words']})"
            )
        if wc > guide["max_words"] * 1.5:
            issues.append(
                f"Q{q.get('question_number', '?')}: answer too long ({wc} words, max ~{guide['max_words']})"
            )

    if marks >= 2 and len(key_points) < min(marks, 2):
        issues.append(
            f"Q{q.get('question_number', '?')}: only {len(key_points)} key points for {marks}-mark question"
        )

    return issues


def validate_solved_paper(solved_questions: list[dict]) -> dict[str, Any]:
    """Validate a complete solved paper."""
    issues: list[str] = []

    if not solved_questions:
        return {"valid": False, "quality_score": 0, "issues": ["No questions solved"]}

    for q in solved_questions:
        issues.extend(validate_solved_question(q))

    # Check total questions have answers
    answered = sum(1 for q in solved_questions if not q.get("answer", {}).get("direct_answer", "").startswith("["))
    answer_rate = answered / len(solved_questions) if solved_questions else 0

    score = max(0, 100 - len(issues) * 5)
    if answer_rate < 0.8:
        score = min(score, 50)

    return {
        "valid": len(issues) == 0,
        "quality_score": score,
        "issues": issues,
        "answer_rate": round(answer_rate * 100, 1),
        "total_questions": len(solved_questions),
        "answered_correctly": answered,
    }


def validate_generated_paper(paper: dict, target_marks: int = 80) -> dict[str, Any]:
    """Validate a generated question paper structure."""
    issues: list[str] = []

    sections = paper.get("paper_info", {}).get("sections", [])
    if not sections:
        return {"valid": False, "quality_score": 0, "issues": ["No sections generated"]}

    all_questions = []
    total_marks = 0
    question_texts = []

    for section in sections:
        sec_name = section.get("name", "?")
        mark_type = section.get("mark_type", 0)
        questions = section.get("questions", [])

        for q in questions:
            q_marks = q.get("marks", 0)
            q_text = _norm(q.get("question_text", ""))

            if q_marks != mark_type:
                issues.append(
                    f"Section {sec_name} Q{q.get('question_number', '?')}: marks ({q_marks}) != section mark_type ({mark_type})"
                )

            total_marks += q_marks

            if q_text in question_texts:
                issues.append(f"Section {sec_name} Q{q.get('question_number', '?')}: duplicate question")
            question_texts.append(q_text)

            all_questions.append(q)

    if total_marks != target_marks:
        issues.append(f"Total marks ({total_marks}) != target ({target_marks})")

    # Check for empty questions
    for q in all_questions:
        if not q.get("question_text", "").strip():
            issues.append(f"Q{q.get('question_number', '?')}: empty question text")

    score = max(0, 100 - len(issues) * 5)

    return {
        "valid": len(issues) == 0,
        "quality_score": score,
        "issues": issues,
        "total_marks": total_marks,
        "total_questions": len(all_questions),
    }


def validate_answer_length(answer: str, marks: int) -> bool:
    """Quick check if answer length is appropriate for marks."""
    if marks not in MARK_GUIDELINES:
        return True
    guide = MARK_GUIDELINES[marks]
    wc = len(answer.split())
    return guide["min_words"] * 0.5 <= wc <= guide["max_words"] * 2
