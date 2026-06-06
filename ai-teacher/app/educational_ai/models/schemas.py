from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


class EducationalBookUploadRequest(BaseModel):
    book_name: str = Field(min_length=1)
    class_level: str = Field(min_length=1)
    subject: str = Field(min_length=1)


class EducationalSearchRequest(BaseModel):
    class_level: str | None = None
    subject: str | None = None
    query: str = Field(min_length=1)
    chapter: str | None = None
    book_id: str | None = None
    k: int = Field(default=10, ge=1, le=50)


class EducationalGlobalSearchRequest(BaseModel):
    query: str = Field(min_length=1)
    k: int = Field(default=10, ge=1, le=50)


class EducationalNotesRequest(BaseModel):
    class_level: str
    subject: str
    topic: str
    book_id: str | None = None


class EducationalMCQRequest(BaseModel):
    class_level: str
    subject: str
    topic: str
    difficulty: Literal["easy", "medium", "hard"] = "medium"
    count: int = Field(default=10, ge=1, le=20)
    book_id: str | None = None


class EducationalQuestionBankRequest(BaseModel):
    class_level: str
    subject: str
    topic: str
    count: int = Field(default=100, ge=10, le=500)
    book_id: str | None = None


class EducationalWorksheetRequest(BaseModel):
    class_level: str
    subject: str
    topic: str
    book_id: str | None = None


class EducationalBookRecord(BaseModel):
    book_id: str
    book_name: str
    class_level: str
    subject: str
    chapters: list[dict[str, Any]] = Field(default_factory=list)
    indexed_at: str
    source_file: str
    chunk_count: int


class EducationalChapterRecord(BaseModel):
    book_id: str
    chapter_number: int
    chapter_name: str
    subject: str
    class_level: str
    start_page: int | None = None
    end_page: int | None = None
