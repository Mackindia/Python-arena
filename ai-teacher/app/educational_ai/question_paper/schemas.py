from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


# ── Request Models ────────────────────────────────────────────────────────────


class SolvePaperRequest(BaseModel):
    class_level: str = Field(min_length=1)
    subject: str = Field(min_length=1)
    topic: str = Field(min_length=1)
    book_id: str | None = None
    total_marks: int = Field(default=80, ge=10, le=200)


class AnalyzePatternRequest(BaseModel):
    paper_id: str = Field(min_length=1)


class CrossPaperAnalysisRequest(BaseModel):
    paper_ids: list[str] = Field(min_length=2, max_length=20, description="2-20 paper IDs to compare")


class ExportRequest(BaseModel):
    paper_id: str = Field(min_length=1)
    format: Literal["pdf", "docx", "txt"] = "pdf"


class SavePaperRequest(BaseModel):
    paper_data: dict[str, Any]
    class_level: str = ""
    subject: str = ""
    source: str = "manual"


class ExportInlineRequest(BaseModel):
    data: dict[str, Any]
    format: str = "txt"


class SectionSpec(BaseModel):
    name: str = Field(min_length=1, description="e.g. A, B, C, D")
    mark_type: int = Field(ge=1, le=10, description="marks per question")
    count: int = Field(ge=1, le=50, description="total questions in section")
    required: int = Field(ge=1, le=50, description="questions student must answer")
    internal_choice: bool = Field(default=False)


# ── CBSE Difficulty Profiles ──────────────────────────────────────────────────

CBSE_DIFFICULTY_PROFILES = {
    "cbse_board": {"Easy": 30, "Medium": 30, "Hard": 40, "description": "CBSE Board Exam (Class 10/12)"},
    "cbse_unit_test": {"Easy": 40, "Medium": 40, "Hard": 20, "description": "CBSE Unit Test / School Exam"},
    "cbse_competitive": {"Easy": 20, "Medium": 30, "Hard": 50, "description": "Competitive Exam (JEE/NEET level)"},
    "cbse_easy": {"Easy": 50, "Medium": 35, "Hard": 15, "description": "Easy Practice Paper"},
    "cbse_hard": {"Easy": 15, "Medium": 25, "Hard": 60, "description": "Hard Practice Paper"},
    "balanced": {"Easy": 33, "Medium": 34, "Hard": 33, "description": "Balanced (equal distribution)"},
}

# CBSE standard section patterns for 80-mark papers
CBSE_SECTION_PATTERNS = {
    "cbse_80": [
        {"name": "A", "mark_type": 1, "count": 20, "required": 20, "internal_choice": False, "description": "MCQs / Very Short Answer"},
        {"name": "B", "mark_type": 2, "count": 7, "required": 5, "internal_choice": False, "description": "Short Answer I"},
        {"name": "C", "mark_type": 3, "count": 7, "required": 5, "internal_choice": False, "description": "Short Answer II"},
        {"name": "D", "mark_type": 5, "count": 3, "required": 2, "internal_choice": True, "description": "Long Answer (internal choice)"},
    ],
    "cbse_40": [
        {"name": "A", "mark_type": 1, "count": 10, "required": 10, "internal_choice": False, "description": "MCQs"},
        {"name": "B", "mark_type": 2, "count": 5, "required": 4, "internal_choice": False, "description": "Short Answer"},
        {"name": "C", "mark_type": 3, "count": 3, "required": 2, "internal_choice": False, "description": "Long Answer"},
        {"name": "D", "mark_type": 5, "count": 1, "required": 1, "internal_choice": False, "description": "Essay"},
    ],
    "cbse_100": [
        {"name": "A", "mark_type": 1, "count": 25, "required": 20, "internal_choice": False, "description": "Section A: MCQs"},
        {"name": "B", "mark_type": 2, "count": 8, "required": 6, "internal_choice": False, "description": "Section B: Short Answer I"},
        {"name": "C", "mark_type": 3, "count": 8, "required": 6, "internal_choice": False, "description": "Section C: Short Answer II"},
        {"name": "D", "mark_type": 5, "count": 4, "required": 3, "internal_choice": True, "description": "Section D: Long Answer"},
    ],
}


class GeneratePaperRequest(BaseModel):
    class_level: str = Field(min_length=1)
    subject: str = Field(min_length=1)
    topic: str = Field(min_length=1)
    book_id: str | None = None
    total_marks: int = Field(default=80, ge=10, le=200)
    sections: list[SectionSpec] = Field(default_factory=list)
    topic_distribution: dict[str, float] | None = Field(default=None, description="topic -> percentage")
    difficulty_distribution: dict[str, float] | None = Field(default=None, description="Easy/Medium/Hard -> percentage")
    difficulty_profile: str | None = Field(
        default=None,
        description="Predefined difficulty profile: cbse_board, cbse_unit_test, cbse_competitive, cbse_easy, cbse_hard, balanced",
    )
    use_cbse_pattern: bool = Field(default=False, description="Use CBSE standard section structure")


# ── Response / Data Models ────────────────────────────────────────────────────


class ExtractedQuestion(BaseModel):
    question_number: str
    question_text: str
    marks: int
    section: str = ""
    has_internal_choice: bool = False
    optional_part: str | None = None
    chapter_hint: str = ""
    diagram_reference: str | None = None


class PaperSection(BaseModel):
    name: str
    mark_type: int
    questions: list[ExtractedQuestion]
    required: int = 0
    internal_choice: bool = False


class PaperInfo(BaseModel):
    total_marks: int
    duration: str = ""
    sections: list[PaperSection]


class AnswerContent(BaseModel):
    direct_answer: str
    key_points: list[str] = Field(default_factory=list)
    common_mistakes: list[str] = Field(default_factory=list)
    exam_tips: str = ""
    word_count: int = 0


class SolvedQuestion(BaseModel):
    question_number: str
    question_text: str
    marks: int
    section: str = ""
    chapter: str = ""
    difficulty: str = ""
    bloom_level: str = ""
    repeat_likelihood: str = ""
    answer: AnswerContent


class PatternAnalysis(BaseModel):
    mark_distribution: dict[str, int] = Field(default_factory=dict)
    total_marks: int = 0
    sections: list[dict[str, Any]] = Field(default_factory=list)
    topic_weightage: dict[str, float] = Field(default_factory=dict)
    difficulty_distribution: dict[str, float] = Field(default_factory=dict)
    bloom_distribution: dict[str, float] = Field(default_factory=dict)
    choice_groups: list[dict[str, Any]] = Field(default_factory=list)
    repeat_candidates: list[dict[str, Any]] = Field(default_factory=list)
    high_value_topics: list[str] = Field(default_factory=list)
    recommended_study_plan: dict[str, list[str]] = Field(default_factory=dict)


class SolvedPaperResult(BaseModel):
    paper_info: PaperInfo
    solved_questions: list[SolvedQuestion]
    pattern_analysis: PatternAnalysis
    source: str = ""
    validation: dict[str, Any] = Field(default_factory=dict)


class GeneratedPaperResult(BaseModel):
    paper_info: PaperInfo
    questions: list[ExtractedQuestion]
    answers: list[SolvedQuestion] | None = None
    validation: dict[str, Any] = Field(default_factory=dict)


class PaperRecord(BaseModel):
    paper_id: str
    source_file: str
    class_level: str
    subject: str
    total_marks: int
    question_count: int
    solved_at: str
