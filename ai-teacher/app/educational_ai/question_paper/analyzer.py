"""Pattern analysis for question papers."""

from __future__ import annotations

import json
import re
from collections import Counter
from typing import Any

from app.core.llm import get_model
from app.educational_ai.question_paper.prompts import build_pattern_analysis_prompt


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


def analyze_pattern(
    paper_info: dict,
    solved_questions: list[dict],
    class_level: str,
    subject: str,
) -> dict[str, Any]:
    """
    Analyze the structure and patterns of a solved question paper.

    Returns pattern analysis with mark distribution, topic weightage,
    difficulty distribution, repeat candidates, and study plan.
    """
    # First, do statistical analysis from the data itself
    stat_analysis = _statistical_analysis(solved_questions, paper_info)

    # Then use LLM for deeper analysis (repeat candidates, study plan)
    model = get_model("fast")
    prompt = build_pattern_analysis_prompt(
        paper_info=paper_info,
        solved_questions=solved_questions,
        class_level=class_level,
        subject=subject,
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
            llm_analysis = _extract_json(response.text or "")

            # Merge statistical analysis with LLM analysis
            result = {**stat_analysis}
            for key in [
                "topic_weightage",
                "bloom_distribution",
                "choice_groups",
                "repeat_candidates",
                "high_value_topics",
                "recommended_study_plan",
            ]:
                if key in llm_analysis and llm_analysis[key]:
                    result[key] = llm_analysis[key]

            return result

        except (json.JSONDecodeError, ValueError) as e:
            issues.append(f"Parse error: {e}")

    # Fallback: return statistical analysis only
    return stat_analysis


def _statistical_analysis(
    solved_questions: list[dict], paper_info: dict
) -> dict[str, Any]:
    """Compute statistical analysis from solved questions data."""
    # Mark distribution
    mark_counts: Counter[int] = Counter()
    section_map: dict[str, dict] = {}

    for q in solved_questions:
        marks = q.get("marks", 1)
        section = q.get("section", "Unknown")
        mark_counts[marks] += 1

        if section not in section_map:
            section_map[section] = {
                "name": section,
                "mark_type": marks,
                "count": 0,
                "total_marks": 0,
            }
        section_map[section]["count"] += 1
        section_map[section]["total_marks"] += marks
        section_map[section]["mark_type"] = marks

    # Difficulty estimation from marks
    difficulty_counts = {"Easy": 0, "Medium": 0, "Hard": 0}
    for q in solved_questions:
        marks = q.get("marks", 1)
        if marks <= 2:
            difficulty_counts["Easy"] += 1
        elif marks <= 3:
            difficulty_counts["Medium"] += 1
        else:
            difficulty_counts["Hard"] += 1

    total_q = len(solved_questions) or 1
    difficulty_dist = {
        k: round(v / total_q * 100, 1) for k, v in difficulty_counts.items()
    }

    # Bloom distribution from solved data
    bloom_counts: Counter[str] = Counter()
    for q in solved_questions:
        bloom = q.get("bloom_level", "")
        if bloom:
            bloom_counts[bloom] += 1

    bloom_dist = {}
    if bloom_counts:
        bloom_dist = {
            k: round(v / total_q * 100, 1)
            for k, v in bloom_counts.most_common()
        }

    # Topic weightage from chapter hints
    topic_marks: dict[str, int] = {}
    for q in solved_questions:
        chapter = q.get("chapter", "") or q.get("chapter_hint", "Unknown")
        topic_marks[chapter] = topic_marks.get(chapter, 0) + q.get("marks", 1)

    total_marks = sum(topic_marks.values()) or 1
    topic_weightage = {
        k: round(v / total_marks * 100, 1) for k, v in topic_marks.items()
    }

    # Choice groups from paper info
    choice_groups = []
    sections_info = paper_info.get("sections", [])
    for sec in sections_info:
        if isinstance(sec, dict):
            choice_groups.append({
                "section": sec.get("name", ""),
                "total_questions": sec.get("count", 0),
                "required": sec.get("required", 0),
                "internal_choice": sec.get("internal_choice", False),
            })

    return {
        "mark_distribution": {
            f"{k}-mark": v for k, v in sorted(mark_counts.items())
        },
        "total_marks": sum(q.get("marks", 1) for q in solved_questions),
        "sections": list(section_map.values()),
        "topic_weightage": topic_weightage,
        "difficulty_distribution": difficulty_dist,
        "bloom_distribution": bloom_dist,
        "choice_groups": choice_groups,
        "repeat_candidates": [],
        "high_value_topics": sorted(
            topic_weightage.keys(),
            key=lambda t: topic_weightage[t],
            reverse=True,
        )[:5],
        "recommended_study_plan": {
            "must_prepare": [],
            "should_prepare": [],
            "low_priority": [],
        },
    }
