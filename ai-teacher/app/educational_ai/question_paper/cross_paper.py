"""Cross-paper pattern analysis — find common questions and repeat patterns."""

from __future__ import annotations

import json
import re
from collections import Counter, defaultdict
from difflib import SequenceMatcher
from typing import Any

from app.core.llm import get_model


def _norm(text: str) -> str:
    return re.sub(r"\s+", " ", text.strip().lower())


def _fuzzy_match(a: str, b: str, threshold: float = 0.75) -> bool:
    return SequenceMatcher(None, _norm(a), _norm(b)).ratio() >= threshold


def cross_paper_analysis(papers: list[dict[str, Any]]) -> dict[str, Any]:
    """
    Analyze patterns across multiple solved papers.

    Finds:
    - Common questions (appear in 2+ papers)
    - Topic frequency across papers
    - Difficulty consistency
    - Most important chapters
    - Repeat prediction
    """
    if not papers:
        return {"error": "No papers to analyze"}

    num_papers = len(papers)

    # ── 1. Common questions (fuzzy matching) ──────────────────────────────────
    all_questions: list[tuple[str, str]] = []  # (question_text, paper_id)
    for paper in papers:
        pid = paper.get("paper_id", "")
        for q in paper.get("solved_questions", []):
            text = q.get("question_text", "")
            if text:
                all_questions.append((text, pid))

    # Group similar questions
    question_groups: list[dict] = []
    used: set[int] = set()

    for i, (text_a, pid_a) in enumerate(all_questions):
        if i in used:
            continue
        group = {"question": text_a, "papers": [pid_a], "paper_count": 1}
        used.add(i)

        for j, (text_b, pid_b) in enumerate(all_questions):
            if j in used or pid_b == pid_a:
                continue
            if _fuzzy_match(text_a, text_b):
                group["papers"].append(pid_b)
                group["paper_count"] += 1
                used.add(j)

        if group["paper_count"] >= 2:
            question_groups.append(group)

    question_groups.sort(key=lambda g: g["paper_count"], reverse=True)

    common_questions = [
        {
            "question": g["question"][:120],
            "appeared_in": g["paper_count"],
            "frequency": f"{round(g['paper_count'] / num_papers * 100)}%",
            "papers": g["papers"][:5],
        }
        for g in question_groups[:20]
    ]

    # ── 2. Topic frequency ────────────────────────────────────────────────────
    topic_paper_count: dict[str, int] = defaultdict(int)
    topic_total_marks: dict[str, int] = defaultdict(int)

    for paper in papers:
        seen_topics: set[str] = set()
        for q in paper.get("solved_questions", []):
            chapter = q.get("chapter", "") or q.get("chapter_hint", "") or "Unknown"
            marks = q.get("marks", 1)
            topic_total_marks[chapter] += marks
            if chapter not in seen_topics:
                topic_paper_count[chapter] += 1
                seen_topics.add(chapter)

    topic_frequency = {}
    for topic in topic_total_marks:
        topic_frequency[topic] = {
            "papers_appeared": topic_paper_count[topic],
            "frequency_pct": round(topic_paper_count[topic] / num_papers * 100, 1),
            "total_marks_across_papers": topic_total_marks[topic],
            "avg_marks_per_paper": round(topic_total_marks[topic] / num_papers, 1),
        }

    topic_frequency = dict(
        sorted(topic_frequency.items(), key=lambda x: x[1]["frequency_pct"], reverse=True)
    )

    # ── 3. Difficulty consistency ─────────────────────────────────────────────
    difficulty_accum: dict[str, list[float]] = defaultdict(list)

    for paper in papers:
        solved = paper.get("solved_questions", [])
        total_q = len(solved) or 1
        counts = {"Easy": 0, "Medium": 0, "Hard": 0}
        for q in solved:
            marks = q.get("marks", 1)
            if marks <= 2:
                counts["Easy"] += 1
            elif marks <= 3:
                counts["Medium"] += 1
            else:
                counts["Hard"] += 1
        for k in counts:
            difficulty_accum[k].append(round(counts[k] / total_q * 100, 1))

    difficulty_consistency = {}
    for level, values in difficulty_accum.items():
        avg = sum(values) / len(values) if values else 0
        std = (sum((v - avg) ** 2 for v in values) / len(values)) ** 0.5 if values else 0
        difficulty_consistency[level] = {
            "avg_pct": round(avg, 1),
            "std_dev": round(std, 1),
            "consistent": std < 10,
        }

    # ── 4. Most important chapters ────────────────────────────────────────────
    chapter_importance = []
    for topic, data in topic_frequency.items():
        chapter_importance.append({
            "chapter": topic,
            "frequency_pct": data["frequency_pct"],
            "avg_marks_per_paper": data["avg_marks_per_paper"],
            "importance_score": round(
                data["frequency_pct"] * 0.6 + min(data["avg_marks_per_paper"] * 2, 100) * 0.4,
                1,
            ),
        })

    chapter_importance.sort(key=lambda c: c["importance_score"], reverse=True)

    # ── 5. Mark distribution across papers ────────────────────────────────────
    mark_dist_accum: dict[int, list[int]] = defaultdict(list)
    for paper in papers:
        solved = paper.get("solved_questions", [])
        counts: Counter[int] = Counter()
        for q in solved:
            counts[q.get("marks", 1)] += 1
        for marks, count in counts.items():
            mark_dist_accum[marks].append(count)

    avg_mark_distribution = {}
    for marks in sorted(mark_dist_accum):
        values = mark_dist_accum[marks]
        avg_mark_distribution[f"{marks}-mark"] = round(sum(values) / len(values), 1)

    # ── 6. LLM-powered repeat prediction ─────────────────────────────────────
    repeat_prediction = _predict_repeats(papers, topic_frequency, common_questions)

    # ── 7. Study plan ─────────────────────────────────────────────────────────
    must_prepare = [c["chapter"] for c in chapter_importance[:5]]
    should_prepare = [c["chapter"] for c in chapter_importance[5:10]]
    low_priority = [c["chapter"] for c in chapter_importance[10:]]

    return {
        "papers_analyzed": num_papers,
        "common_questions": common_questions,
        "topic_frequency": topic_frequency,
        "difficulty_consistency": difficulty_consistency,
        "avg_mark_distribution": avg_mark_distribution,
        "most_important_chapters": chapter_importance[:10],
        "repeat_prediction": repeat_prediction,
        "recommended_study_plan": {
            "must_prepare": must_prepare,
            "should_prepare": should_prepare,
            "low_priority": low_priority,
        },
    }


def _predict_repeats(
    papers: list[dict],
    topic_frequency: dict,
    common_questions: list[dict],
) -> list[dict[str, Any]]:
    """Use LLM to predict which topics/questions are most likely to repeat."""
    # Summarize data for LLM
    topics_summary = "\n".join(
        f"  - {t}: appeared in {d['frequency_pct']}% of papers, avg {d['avg_marks_per_paper']} marks/paper"
        for t, d in list(topic_frequency.items())[:15]
    )
    common_summary = "\n".join(
        f"  - {q['question'][:80]}... (appeared in {q['appeared_in']}/{len(papers)} papers)"
        for q in common_questions[:10]
    )

    prompt = f"""You are an expert exam pattern analyst. Based on {len(papers)} past papers, predict which topics and questions are most likely to repeat.

Topic Frequency:
{topics_summary}

Common Questions (appeared in multiple papers):
{common_summary}

Predict:
1. Top 5 topics most likely to appear in the next exam
2. Top 5 specific questions most likely to repeat
3. Any emerging patterns (topics gaining importance)

Return STRICTLY valid JSON:
{{
  "likely_topics": [
    {{"topic": "string", "confidence": "High/Medium/Low", "reason": "string"}}
  ],
  "likely_questions": [
    {{"question": "string", "confidence": "High/Medium/Low", "reason": "string"}}
  ],
  "emerging_patterns": ["string — patterns observed across papers"]
}}
"""

    try:
        model = get_model("pro")
        response = model.generate_content(prompt)
        text = response.text or ""
        fenced = re.search(r"```(?:json)?\s*(.*?)\s*```", text, flags=re.DOTALL)
        if fenced:
            text = fenced.group(1).strip()
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1:
            text = text[start : end + 1]
        return json.loads(text)
    except Exception:
        return {
            "likely_topics": [
                {"topic": t, "confidence": "High", "reason": f"appeared in {d['frequency_pct']}% of papers"}
                for t, d in list(topic_frequency.items())[:5]
            ],
            "likely_questions": [],
            "emerging_patterns": [],
        }
