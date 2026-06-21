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
        Create a printable worksheet for class {class_level} subject {subject} topic {topic}.
        Include learning objectives, MCQs, fill in the blanks, match the following, short answers, and long answers.
        Return valid JSON object only.
        Use only the retrieved context.

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
