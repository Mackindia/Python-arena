from __future__ import annotations

from textwrap import dedent


def build_notes_prompt(topic: str, class_level: str, subject: str, context: str) -> str:
    return dedent(
        f"""
        You are an expert educational content designer.
        Create structured notes for class {class_level} subject {subject} topic {topic}.
        Use only the retrieved context.
        Return valid JSON with keys: title, summary, key_concepts, important_points, revision_notes.

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
