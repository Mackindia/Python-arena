"""Prompt templates for the Question Paper Intelligence engine."""

from __future__ import annotations

from textwrap import dedent


def build_extraction_prompt(class_level: str, subject: str, raw_text: str) -> str:
    return dedent(
        f"""
        You are an expert exam paper parser for class {class_level} {subject}.
        Extract EVERY question from the exam paper text below.

        For each question, identify:
        - question_number: the number or label (e.g. "1", "2(a)", "3.ii")
        - question_text: the full question text, cleaned up
        - marks: marks allocated (infer from context if not explicit — count "marks" mentions, asterisks, or standard patterns)
        - section: which section it belongs to (e.g. "A", "B", "C", "D" or "Part I", "Part II")
        - has_internal_choice: true if there is an "OR" or "internal choice" for this question
        - optional_part: if has_internal_choice is true, the alternative question text
        - chapter_hint: best guess at the chapter/topic this question covers
        - diagram_reference: if the question asks to draw/diagram/label something, describe what diagram is needed; null otherwise

        Also extract:
        - total_marks: total marks for the paper
        - duration: exam duration if mentioned
        - section_info: list of sections with their mark types and counts

        RULES:
        - Do NOT skip any question, even if partially readable.
        - If a question is unclear, extract what you can and note it.
        - Marks should be positive integers.
        - Return STRICTLY valid JSON.

        Return JSON with these exact keys:
        {{
          "total_marks": number,
          "duration": "string",
          "sections": [
            {{
              "name": "string",
              "mark_type": number,
              "count": number
            }}
          ],
          "questions": [
            {{
              "question_number": "string",
              "question_text": "string",
              "marks": number,
              "section": "string",
              "has_internal_choice": boolean,
              "optional_part": "string or null",
              "chapter_hint": "string",
              "diagram_reference": "string or null"
            }}
          ]
        }}

        Exam Paper Text:
        {raw_text}
        """
    ).strip()


def build_solve_prompt(
    question_text: str,
    marks: int,
    class_level: str,
    subject: str,
    context: str,
    diagram_reference: str | None = None,
) -> str:
    word_guide = {
        1: "10-20 words, 1-2 sentences",
        2: "30-50 words, 2-3 sentences or 2 key points",
        3: "60-100 words, 3-5 sentences with examples",
        4: "80-120 words, structured answer with heading",
        5: "120-180 words, intro-body-conclusion with detailed explanation",
    }
    guide = word_guide.get(marks, f"{marks * 25}-{marks * 40} words")

    diagram_note = ""
    if diagram_reference:
        diagram_note = f"\n- The question asks about: {diagram_reference}. Describe what should be drawn/labeled."

    return dedent(
        f"""
        You are an expert teacher creating an answer key for a class {class_level} {subject} exam.
        Answer the following question worth {marks} mark(s).

        Question: {question_text}

        Provide a student-level answer that is easy to understand.

        Return STRICTLY valid JSON with these exact keys:
        {{
          "direct_answer": "string — the complete answer in {guide}",
          "key_points": ["string — each key point the examiner looks for (at least {marks} points)"],
          "common_mistakes": ["string — mistakes students typically make for this question"],
          "exam_tips": "string — one-liner tip for scoring full marks"
        }}

        RULES:
        - Answer must be appropriate for {marks} marks — NOT too short, NOT too long.
        - Use simple, clear language suitable for a class {class_level} student.
        - For definitions: state definition + one example.
        - For "explain" questions: use bullet points or structured paragraphs.
        - For numerical questions: show step-by-step working.
        - For "differentiate" questions: use comparison format.
        - key_points must have at least {marks} items.
        {diagram_note}
        - Do NOT hallucinate. Use only the retrieved context.
        - The direct_answer field should be the complete, ready-to-write answer.
        - Keep it concise but complete — the student should be able to write this in an exam.

        Retrieved Context:
        {context}
        """
    ).strip()


def build_pattern_analysis_prompt(
    paper_info: dict,
    solved_questions: list[dict],
    class_level: str,
    subject: str,
) -> str:
    questions_summary = "\n".join(
        f"  Q{q.get('question_number', '?')}: [{q.get('marks', '?')} marks] [{q.get('section', '?')}] {q.get('question_text', '')[:80]}..."
        for q in solved_questions
    )

    return dedent(
        f"""
        You are an expert exam pattern analyst for class {class_level} {subject}.
        Analyze this question paper's structure and identify patterns.

        Paper Info:
        - Total Marks: {paper_info.get('total_marks', 'unknown')}
        - Duration: {paper_info.get('duration', 'unknown')}
        - Sections: {paper_info.get('sections', [])}

        Questions:
        {questions_summary}

        Return STRICTLY valid JSON with these exact keys:
        {{
          "mark_distribution": {{
            "1-mark": number_of_1_mark_questions,
            "2-mark": number,
            "3-mark": number,
            "5-mark": number
          }},
          "topic_weightage": {{
            "topic_name": percentage_of_total_marks
          }},
          "difficulty_distribution": {{
            "Easy": percentage,
            "Medium": percentage,
            "Hard": percentage
          }},
          "bloom_distribution": {{
            "Remember": percentage,
            "Understand": percentage,
            "Apply": percentage,
            "Analyze": percentage,
            "Evaluate": percentage,
            "Create": percentage
          }},
          "choice_groups": [
            {{
              "section": "string",
              "total_questions": number,
              "required": number,
              "internal_choice": boolean
            }}
          ],
          "repeat_candidates": [
            {{
              "question": "string — the question text",
              "likelihood": "Very High | High | Medium | Low",
              "reason": "string — why this might repeat"
            }}
          ],
          "high_value_topics": ["string — topics that carry the most marks"],
          "recommended_study_plan": {{
            "must_prepare": ["string — topics with highest weightage"],
            "should_prepare": ["string — moderate weightage topics"],
            "low_priority": ["string — rarely tested topics"]
          }}
        }}

        RULES:
        - Mark distribution should account for all questions.
        - Topic weightage percentages should sum to approximately 100.
        - Difficulty and Bloom's distributions should sum to approximately 100.
        - Identify at least 5 repeat candidates based on question importance signals.
        - High value topics are sorted by total marks allocated.
        - Study plan is based on weightage and repeat likelihood.
        """
    ).strip()


def build_generate_paper_prompt(
    class_level: str,
    subject: str,
    topic: str,
    total_marks: int,
    sections: list[dict],
    topic_distribution: dict | None,
    difficulty_distribution: dict | None,
    existing_questions: list[str],
    context: str,
    cbse_mode: bool = False,
) -> str:
    sections_desc = "\n".join(
        f"  Section {s['name']}: {s['count']} questions × {s['mark_type']} marks each, answer {s['required']}, internal_choice={s.get('internal_choice', False)}"
        for s in sections
    )

    topic_dist_desc = ""
    if topic_distribution:
        topic_dist_desc = "\nTopic Distribution:\n" + "\n".join(
            f"  - {t}: {p}%" for t, p in topic_distribution.items()
        )

    diff_dist_desc = ""
    if difficulty_distribution:
        diff_dist_desc = "\nDifficulty Distribution (MUST be followed exactly):\n" + "\n".join(
            f"  - {d}: {p}%" for d, p in difficulty_distribution.items()
        )

    existing_desc = ""
    if existing_questions:
        existing_desc = "\nDo NOT repeat these questions:\n" + "\n".join(
            f"  - {q[:80]}" for q in existing_questions[:20]
        )

    cbse_rules = ""
    if cbse_mode:
        cbse_rules = """
        CBSE PATTERN RULES:
        - Section A (1-mark): Pure MCQs with 4 options (A/B/C/D). No negative marking indicated.
        - Section B (2-mark): Direct, precise answers. 2-3 sentences max. No diagrams needed.
        - Section C (3-mark): Structured answers with 3 key points. Include examples where applicable.
        - Section D (5-mark): Comprehensive answers with introduction, body, conclusion.
        - Internal choice in Section D: Generate BOTH alternatives with "(OR)" label.
        - Questions must follow CBSE Bloom's taxonomy: Remember (30%), Understand (30%), Apply (20%), Analyze (15%), Evaluate/Evaluate (5%).
        - Use NCERT-aligned terminology and concepts.
        - For Science subjects: include diagrams description where appropriate.
        - For Mathematics: show step-by-step working for numerical questions.
        - All questions must be answerable within the standard time allocation.
        """

    return dedent(
        f"""
        You are an expert CBSE exam paper setter for class {class_level} {subject}.
        Generate a complete {total_marks}-mark question paper following {"CBSE board pattern" if cbse_mode else "standard exam pattern"}.

        Section Structure:
        {sections_desc}
        {topic_dist_desc}
        {diff_dist_desc}
        {existing_desc}
        {cbse_rules}

        GENERAL RULES:
        - Generate exactly {total_marks} marks total.
        - Each question must match its section's mark type EXACTLY.
        - Questions should be appropriate difficulty for their marks.
        - Include variety: definitions, explanations, applications, comparisons, problems, diagram-based.
        - For sections with internal_choice, generate both options with "(OR)" between them.
        - Use the retrieved context for factual accuracy.
        - Each question must be unique, well-formed, and grammatically correct.
        - Mark the difficulty of each question as Easy, Medium, or Hard.
        - Distribute difficulties according to the specified percentages.

        Return STRICTLY valid JSON with these exact keys:
        {{
          "total_marks": {total_marks},
          "sections": [
            {{
              "name": "string",
              "mark_type": number,
              "questions": [
                {{
                  "question_number": "string",
                  "question_text": "string",
                  "marks": number,
                  "has_internal_choice": boolean,
                  "optional_part": "string or null",
                  "chapter_hint": "string",
                  "difficulty": "Easy | Medium | Hard"
                }}
              ]
            }}
          ]
        }}

        Retrieved Context:
        {context}
        """
    ).strip()


def build_generate_answers_prompt(
    questions: list[dict],
    class_level: str,
    subject: str,
    context: str,
) -> str:
    questions_desc = "\n".join(
        f"  Q{q.get('question_number', '?')}: [{q.get('marks', '?')} marks] {q.get('question_text', '')[:100]}"
        for q in questions
    )

    return dedent(
        f"""
        You are an expert teacher creating an answer key for a class {class_level} {subject} exam.
        Provide concise, student-level answers for each question below.

        Questions:
        {questions_desc}

        Return STRICTLY valid JSON array with one answer per question:
        [
          {{
            "question_number": "string",
            "question_text": "string",
            "marks": number,
            "direct_answer": "string — complete answer appropriate for the marks",
            "key_points": ["string — key points the examiner looks for"],
            "common_mistakes": ["string — typical student mistakes"],
            "exam_tips": "string — tip for scoring full marks"
          }}
        ]

        RULES:
        - Answer length must match marks: 1-mark = 1 sentence, 2-marks = 2-3 sentences, 3-marks = 3-5 sentences, 5-marks = detailed paragraph.
        - Use simple language suitable for class {class_level}.
        - Do NOT hallucinate. Use only the retrieved context.
        - Each answer must be complete and ready to write in an exam.

        Retrieved Context:
        {context}
        """
    ).strip()
