from typing import Any


def _format_mcq(index: int, item: dict[str, Any]) -> str:
    options = item.get("options", {})
    a = str(options.get("A", "")).strip()
    b = str(options.get("B", "")).strip()
    c = str(options.get("C", "")).strip()
    d = str(options.get("D", "")).strip()
    answer_letter = str(item.get("answer_letter", "")).strip().upper()
    answer_text = str(item.get("answer_text", "")).strip()
    explanation = str(item.get("explanation", "")).strip()

    return (
        f"{index}. {str(item.get('question', '')).strip()}\n\n"
        f"A) {a} B) {b} C) {c} D) {d}\n\n"
        f"Answer: {answer_letter}) {answer_text}\n\n"
        f"Explanation: {explanation}"
    )


def format_worksheet(worksheet: dict[str, Any]) -> str:
    """Return teacher-friendly worksheet text from structured worksheet JSON."""
    topic = worksheet.get("topic", "")
    grade_level = worksheet.get("grade_level", "")
    sections = worksheet.get("sections", {})

    lines: list[str] = [
        "WORKSHEET",
        f"Topic: {topic}",
        f"Grade Level: {grade_level}",
        "",
        "Section A - MCQs (10)",
    ]

    for i, item in enumerate(sections.get("section_a_mcqs", []), start=1):
        lines.append(_format_mcq(i, item))
        lines.append("")

    lines.append("Section B - Fill in the Blanks (10)")
    for i, item in enumerate(sections.get("section_b_fill_blanks", []), start=1):
        lines.append(f"{i}. {str(item.get('question', '')).strip()}")
        lines.append(f"Answer: {str(item.get('answer', '')).strip()}")
        lines.append("")

    lines.append("Section C - Short Answer Questions (8)")
    for i, item in enumerate(sections.get("section_c_short_answers", []), start=1):
        lines.append(f"{i}. {str(item.get('question', '')).strip()}")
        lines.append(f"Answer Guidance (2-5 lines): {str(item.get('answer_guidance', '')).strip()}")
        lines.append("")

    lines.append("Section D - Long Answer Questions (5)")
    for i, item in enumerate(sections.get("section_d_long_answers", []), start=1):
        lines.append(f"{i}. {str(item.get('question', '')).strip()}")
        lines.append(f"Answer Guidance (8-15 lines): {str(item.get('answer_guidance', '')).strip()}")
        lines.append("")

    lines.append("Section E - Application-Based Questions (5)")
    for i, item in enumerate(sections.get("section_e_application", []), start=1):
        lines.append(f"{i}. {str(item.get('question', '')).strip()}")
        lines.append(f"Answer Guidance: {str(item.get('answer_guidance', '')).strip()}")
        lines.append("")

    lines.append("Section F - Case Study Questions (3 Case Studies)")
    for case_index, case in enumerate(sections.get("section_f_case_studies", []), start=1):
        lines.append(f"Case Study {case_index}:")
        lines.append(str(case.get("scenario", "")).strip())
        lines.append("Questions:")
        for q_index, q in enumerate(case.get("questions", []), start=1):
            lines.append(f"{q_index}. {str(q.get('question', '')).strip()}")
        lines.append("")

    return "\n".join(lines).strip()


def build_structured_output(
    worksheet_json: dict[str, Any],
    validation: dict[str, Any],
    worksheet_text: str,
) -> dict[str, Any]:
    """Return API-friendly structured payload with both text and JSON variants."""
    return {
        "worksheet": worksheet_text,
        "worksheet_json": worksheet_json,
        "quality_score": validation.get("quality_score", 0),
        "difficulty_distribution": validation.get("difficulty_stats", {}),
        "bloom_distribution": validation.get("bloom_stats", {}),
        "question_type_distribution": validation.get("question_type_stats", {}),
        "validation_passed": validation.get("valid", False),
        "validation": validation,
    }
