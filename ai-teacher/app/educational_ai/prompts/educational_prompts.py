from __future__ import annotations

from textwrap import dedent


def build_notes_prompt(topic: str, class_level: str, subject: str, context: str) -> str:
    return dedent(
        f"""
        You are an expert educational content designer for class {class_level} students.
        Create structured notes for subject {subject} topic "{topic}".

        Use ONLY the retrieved context below. Do not invent facts.

        Return STRICTLY valid JSON with these exact keys:
        {{
          "title": "string — clear title for the notes",
          "summary": "string — 2-3 sentence overview",
          "key_concepts": ["string — each concept as a plain sentence, NOT an object"],
          "important_points": ["string — key takeaways"],
          "revision_notes": ["string — quick revision bullets"],
          "real_world_analogies": ["string — a real-life analogy for each key concept to help students relate"]
        }}

        RULES:
        - key_concepts MUST be an array of plain strings, NOT objects.
        - real_world_analogies MUST be an array of plain strings, each explaining a real-life comparison.
        - Every point should be age-appropriate for class {class_level}.
        - Use simple, clear language.

        Retrieved Context:
        {context}
        """
    ).strip()


def build_mcq_prompt(topic: str, class_level: str, subject: str, difficulty: str, count: int, context: str) -> str:
    return dedent(
        f"""
        You are an expert assessment designer.
        Create exactly {count} MCQs for class {class_level} subject {subject} topic {topic}.
        Difficulty preference: {difficulty}.
        Mix recall, understanding, and application.
        Use only the retrieved context.
        Return valid JSON array with question, options, answer, explanation, type, difficulty, bloom.

        Retrieved Context:
        {context}
        """
    ).strip()


def build_question_bank_prompt(topic: str, class_level: str, subject: str, count: int, context: str) -> str:
    return dedent(
        f"""
        Generate a diverse question bank of {count} items for class {class_level} subject {subject} topic {topic}.
        Include MCQ, very short answer, short answer, long answer, and HOTS.
        Return valid JSON array with question, type, difficulty, bloom, answer, concept, chapter, book_id, source_evidence.
        Use only the retrieved context.

        Retrieved Context:
        {context}
        """
    ).strip()


def build_worksheet_prompt(topic: str, class_level: str, subject: str, context: str) -> str:
    return dedent(
        f"""
        You are an expert educational content designer.
        Create a printable worksheet for class {class_level} subject {subject} topic "{topic}".
        Use ONLY the retrieved context. Do not invent facts.

        Return STRICTLY valid JSON matching this EXACT schema (no extra keys, no deviations):

        {{
          "worksheet_title": "string — title of the worksheet",
          "class": "{class_level}",
          "subject": "{subject}",
          "topic": "{topic}",
          "learning_focus": ["string — 3-5 key focus areas"],
          "learning_objectives": ["string — 3-5 objectives starting with 'Students will...'"],
          "sections": [
            {{
              "type": "MCQs",
              "title": "Section A — Multiple Choice Questions",
              "instructions": "string — instructions for students",
              "questions": [
                {{
                  "question_number": "Q1",
                  "question_text": "string — the question",
                  "options": {{"A": "string", "B": "string", "C": "string", "D": "string"}},
                  "correct_option": "A"
                }}
              ]
            }},
            {{
              "type": "Fill in the Blanks",
              "title": "Section B — Fill in the Blanks",
              "instructions": "string — instructions for students",
              "questions": [
                {{
                  "question_number": "Q1",
                  "question_text": "string with ________ for the blank",
                  "correct_answer": "string — the word/phrase that fills the blank"
                }}
              ]
            }},
            {{
              "type": "Match the Following",
              "title": "Section C — Match the Following",
              "instructions": "string — instructions for students",
              "columns": {{
                "Column A": ["string — item 1", "string — item 2", "string — item 3", "string — item 4", "string — item 5"],
                "Column B": ["string — match 1", "string — match 2", "string — match 3", "string — match 4", "string — match 5"]
              }},
              "correct_matches": {{"1": "string — matching option text from Column B", "2": "string", "3": "string", "4": "string", "5": "string"}}
            }},
            {{
              "type": "Short Answer Questions",
              "title": "Section D — Short Answer Questions",
              "instructions": "string — instructions for students",
              "questions": [
                {{
                  "question_number": "Q1",
                  "question_text": "string — the question",
                  "expected_answer_elements": ["string — key point 1", "string — key point 2", "string — key point 3"]
                }}
              ]
            }},
            {{
              "type": "Long Answer Questions",
              "title": "Section E — Long Answer Questions",
              "instructions": "string — instructions for students",
              "questions": [
                {{
                  "question_number": "Q1",
                  "question_text": "string — the question",
                  "expected_answer_elements": ["string — paragraph 1", "string — paragraph 2", "string — paragraph 3"]
                }}
              ]
            }}
          ]
        }}

        DIVERSITY RULES (MANDATORY — failure to follow = invalid worksheet):
        - Each question MUST test a DIFFERENT concept, fact, or subtopic. No two questions may assess the same piece of knowledge.
        - Spread questions across these cognitive levels: at least 1 Remember, 1 Understand, 1 Apply, 1 Analyze, 1 Evaluate per section where applicable.
        - Vary question phrasing: mix definitions, comparisons, "which is correct", cause-effect, real-world scenarios, true/false reasoning, fill-from-context.
        - NEVER rephrase the same fact into two different questions. If you find yourself writing a similar question, pick a completely different concept from the context.
        - For MCQs: each option must be plausible but only one clearly correct. Distractors should be common misconceptions, not obviously wrong.
        - For Fill in the Blanks: test different facts — definitions, formulas, properties, examples — not the same concept repeated.
        - For Match the Following: pair related but distinct items (e.g., property-name pairs, term-definitions, example-classifications). No redundant matches.
        - For Short/Long Answers: each must require explaining a different concept or solving a different problem.

        STRUCTURAL RULES:
        - "sections" MUST be an ARRAY of exactly 5 objects in this order: MCQs, Fill in the Blanks, Match the Following, Short Answer Questions, Long Answer Questions.
        - Each section MUST have "type" matching EXACTLY: "MCQs", "Fill in the Blanks", "Match the Following", "Short Answer Questions", "Long Answer Questions".
        - MCQ questions MUST have "correct_option" as a single letter "A", "B", "C", or "D".
        - Fill in the blanks MUST have "correct_answer" (the word that fills the blank).
        - Match the Following MUST have "columns" with "Column A" and "Column B" arrays, and "correct_matches" object mapping "1"-"5" to Column B values.
        - Short and Long answers MUST have "expected_answer_elements" as an array of strings.
        - Generate exactly 5 MCQs, 5 fill-in-the-blanks, 5 match items, 3 short answers, and 2 long answers.
        - Every question must be answerable from the retrieved context only.

        Retrieved Context:
        {context}
        """
    ).strip()


def build_lesson_plan_prompt(topic: str, class_level: str, subject: str, duration_minutes: int, context: str) -> str:
    return dedent(
        f"""
        You are an expert curriculum designer and classroom teacher.
        Create a detailed, ready-to-teach lesson plan for class {class_level} subject {subject}.
        Topic: "{topic}"
        Duration: {duration_minutes} minutes.

        Use ONLY the retrieved context below. Do not invent content.

        Return STRICTLY valid JSON with these exact keys:
        {{
          "title": "string — lesson title",
          "subject": "{subject}",
          "class_level": "{class_level}",
          "topic": "{topic}",
          "duration_minutes": {duration_minutes},
          "learning_objectives": [
            "string — each objective starts with 'Students will be able to...' and maps to a Bloom's level"
          ],
          "prerequisites": ["string — what students should know before this lesson"],
          "materials_needed": ["string — books, tools, software, etc."],
          "lesson_structure": [
            {{
              "phase": "string — e.g. 'Introduction', 'Core Activity', 'Practice', 'Assessment', 'Wrap-up'",
              "duration_minutes": number,
              "description": "string — what the teacher does",
              "student_activity": "string — what students do",
              "teaching_strategy": "string — e.g. 'Direct Instruction', 'Think-Pair-Share', 'Hands-on'"
            }}
          ],
          "key_vocab": [
            {{
              "term": "string",
              "definition": "string — simple definition for class {class_level}"
            }}
          ],
          "formative_assessment": "string — how to check understanding during the lesson",
          "homework": "string — a take-home task",
          "real_world_connection": "string — how this topic connects to real life"
        }}

        RULES:
        - Lesson structure phases must sum to {duration_minutes} minutes.
        - Each phase should have a clear teacher action and student activity.
        - Use age-appropriate language for class {class_level}.
        - Include at least 3 learning objectives covering different Bloom's levels.

        Retrieved Context:
        {context}
        """
    ).strip()


def build_bloom_prompt(topic: str, class_level: str, subject: str, context: str) -> str:
    return dedent(
        f"""
        You are an expert in Bloom's Taxonomy and educational assessment.
        Analyze the topic "{topic}" for class {class_level} subject {subject} using Bloom's 6 cognitive levels.

        Use ONLY the retrieved context below.

        Return STRICTLY valid JSON with these exact keys:
        {{
          "topic": "{topic}",
          "subject": "{subject}",
          "class_level": "{class_level}",
          "bloom_analysis": [
            {{
              "level": "Remember",
              "description": "string — what this level means for this topic",
              "key_verbs": ["string — action verbs for this level"],
              "sample_questions": ["string — 2-3 sample questions at this level"],
              "suggested_activities": ["string — activities that target this level"],
              "assessment_strategy": "string — how to assess this level"
            }},
            {{
              "level": "Understand",
              ...
            }},
            {{
              "level": "Apply",
              ...
            }},
            {{
              "level": "Analyze",
              ...
            }},
            {{
              "level": "Evaluate",
              ...
            }},
            {{
              "level": "Create",
              ...
            }}
          ],
          "coverage_map": {{
            "Remember": "string — percentage estimate of textbook coverage",
            "Understand": "string",
            "Apply": "string",
            "Analyze": "string",
            "Evaluate": "string",
            "Create": "string"
          }},
          "gap_analysis": ["string — Bloom's levels that are underrepresented in current materials"],
          "recommendations": ["string — specific suggestions to improve cognitive depth"],
          "overall_cognitive_depth": "string — 'Shallow', 'Moderate', or 'Deep' with explanation"
        }}

        RULES:
        - Each Bloom's level must have at least 2 sample questions.
        - Activities must be practical for a class {class_level} classroom.
        - Gap analysis should identify which levels need more attention.
        - Recommendations must be actionable for the teacher.

        Retrieved Context:
        {context}
        """
    ).strip()


def build_concept_map_prompt(topic: str, class_level: str, subject: str, context: str) -> str:
    return dedent(
        f"""
        You are an expert in visual learning and knowledge organization.
        Create a concept map for topic "{topic}" in subject {subject} for class {class_level}.

        Use ONLY the retrieved context below.

        Return STRICTLY valid JSON with these exact keys:
        {{
          "topic": "{topic}",
          "subject": "{subject}",
          "class_level": "{class_level}",
          "nodes": [
            {{
              "id": "string — unique node id like 'n1', 'n2'",
              "label": "string — short concept name (max 5 words)",
              "description": "string — one-line explanation",
              "importance": "core" | "supporting" | "detail",
              "bloom_level": "Remember|Understand|Apply|Analyze|Evaluate|Create"
            }}
          ],
          "edges": [
            {{
              "source": "string — node id",
              "target": "string — node id",
              "relationship": "string — e.g. 'leads to', 'requires', 'is part of', 'contrasts with'",
              "description": "string — one-line explanation of the relationship"
            }}
          ],
          "hierarchy": {{
            "root": "string — the central concept node id",
            "levels": [
              {{
                "level": number,
                "node_ids": ["string — node ids at this level"],
                "description": "string — what this hierarchy level represents"
              }}
            ]
          }},
          "key_relationships_summary": ["string — 3-5 most important connections explained"],
          "learning_path": ["string — suggested order to learn these concepts"],
          "real_world_connections": ["string — how these concepts connect to real life"]
        }}

        RULES:
        - Include 8-15 nodes total (mix of core, supporting, and detail).
        - Every node must be connected to at least one other node.
        - Relationships must be meaningful, not just "related to".
        - hierarchy levels should show progression from basic to advanced.
        - learning_path should be a logical study order.

        Retrieved Context:
        {context}
        """
    ).strip()
