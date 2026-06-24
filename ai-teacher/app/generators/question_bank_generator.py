from __future__ import annotations

import csv
import json
import math
import re
from datetime import datetime
from pathlib import Path
from typing import Any

from app.core.llm import get_model
from app.retrieval.retriever import retrieve_context
from app.validators.question_bank_validator import validate_question_bank

QUESTION_BANK_DIR = Path("question_bank")


def _allocate_counts(total: int, ratios: dict[str, float]) -> dict[str, int]:
    raw = {k: total * v for k, v in ratios.items()}
    base = {k: int(math.floor(v)) for k, v in raw.items()}
    rem = total - sum(base.values())
    order = sorted(raw.items(), key=lambda kv: kv[1] - base[kv[0]], reverse=True)
    for i in range(rem):
        base[order[i % len(order)][0]] += 1
    return base


def _extract_json_array(raw_text: str) -> list[dict[str, Any]]:
    cleaned = raw_text.strip()
    fenced = re.search(r"```(?:json)?\s*(\[.*\])\s*```", cleaned, flags=re.DOTALL)
    if fenced:
        cleaned = fenced.group(1)

    if not cleaned.startswith("["):
        start = cleaned.find("[")
        end = cleaned.rfind("]")
        if start != -1 and end != -1 and end > start:
            cleaned = cleaned[start : end + 1]

    parsed = json.loads(cleaned)
    if not isinstance(parsed, list):
        raise ValueError("Question bank response is not a JSON array")
    return parsed


def _build_batch_prompt(
    topic: str,
    batch_size: int,
    context: str,
    difficulty_targets: dict[str, int],
    bloom_targets: dict[str, int],
    attempt: int,
    previous_issues: list[str] | None,
    book_id: str | None,
    chapter_hint: str | None,
) -> str:
    retry = ""
    if attempt > 1 and previous_issues:
        retry = "\nFix all validation errors and regenerate batch:\n" + "\n".join(
            f"- {issue}" for issue in previous_issues[:20]
        )

    return f"""
You are generating a high-quality educational question bank batch.

Topic: {topic}
Batch size: {batch_size}
Book id: {book_id or 'auto'}
Chapter hint: {chapter_hint or 'from context'}
{retry}
Generate diverse questions with these exact type families represented:
- mcq
- short_answer
- long_answer
- application
- case-based
- scenario-based

Difficulty distribution for this batch (exact counts): {difficulty_targets}
Bloom distribution for this batch (exact counts): {bloom_targets}

Rules:
- No duplicate/reworded duplicate questions.
- No direct copy-paste.
- Ground every question in source context.
- Provide source_evidence as exact short phrase from context.
- Provide chapter and book_id metadata.

Return only JSON array with items in schema:
{{
  "question": "string",
  "type": "mcq|short_answer|long_answer|application|case-based|scenario-based",
  "difficulty": "easy|medium|hard",
  "bloom": "remember|understand|apply|analyze|evaluate|create",
  "chapter": "string",
  "book_id": "string",
  "concept": "string",
  "source_evidence": "exact short phrase from context",
  "answer": "string"
}}

Source context:
{context}
"""


def _write_question_bank_files(records: list[dict[str, Any]], topic: str) -> dict[str, str]:
    QUESTION_BANK_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    safe_topic = re.sub(r"[^a-zA-Z0-9]+", "_", topic).strip("_").lower() or "topic"

    json_path = QUESTION_BANK_DIR / f"{safe_topic}_{timestamp}.json"
    csv_path = QUESTION_BANK_DIR / f"{safe_topic}_{timestamp}.csv"

    json_path.write_text(json.dumps(records, indent=2), encoding="utf-8")

    fields = [
        "question",
        "type",
        "difficulty",
        "bloom",
        "chapter",
        "book_id",
        "concept",
        "source_evidence",
        "answer",
    ]
    with csv_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        for record in records:
            writer.writerow({k: record.get(k, "") for k in fields})

    return {"json": str(json_path), "csv": str(csv_path)}


def generate_question_bank(
    topic: str,
    total_questions: int = 500,
    book_id: str | None = None,
) -> dict[str, Any]:
    if total_questions <= 0:
        raise ValueError("total_questions must be greater than 0")

    retrieval = retrieve_context(query=topic, book_id=book_id, k=20, search_type="mmr", fetch_k=100)
    context = retrieval["context"]
    if not context.strip():
        raise ValueError("No retrieved context available for question bank generation.")

    model = get_model("pro")

    # Generate in bounded batches to keep prompt/response size manageable.
    batch_size = min(100, total_questions)
    batches = math.ceil(total_questions / batch_size)

    all_records: list[dict[str, Any]] = []

    for batch_index in range(batches):
        remaining = total_questions - len(all_records)
        current_batch_size = min(batch_size, remaining)

        diff_targets = _allocate_counts(current_batch_size, {"easy": 0.20, "medium": 0.50, "hard": 0.30})
        bloom_targets = _allocate_counts(
            current_batch_size,
            {
                "remember": 0.20,
                "understand": 0.25,
                "apply": 0.25,
                "analyze": 0.15,
                "evaluate": 0.10,
                "create": 0.05,
            },
        )

        issues: list[str] = []
        parsed_batch: list[dict[str, Any]] = []

        for attempt in range(1, 4):
            prompt = _build_batch_prompt(
                topic=topic,
                batch_size=current_batch_size,
                context=context,
                difficulty_targets=diff_targets,
                bloom_targets=bloom_targets,
                attempt=attempt,
                previous_issues=issues,
                book_id=book_id,
                chapter_hint=None,
            )

            response = model.generate_content(prompt)
            raw = response.text or ""

            try:
                parsed_batch = _extract_json_array(raw)
            except Exception as ex:
                issues = [f"Batch {batch_index + 1} JSON parse error: {ex}"]
                continue

            # Deduplicate within running bank quickly before full validation.
            existing_q = {str(q.get("question", "")).strip().lower() for q in all_records}
            parsed_batch = [q for q in parsed_batch if str(q.get("question", "")).strip().lower() not in existing_q]

            # Fill missing optional metadata defensively.
            for rec in parsed_batch:
                rec.setdefault("book_id", book_id or "multi_book")
                rec.setdefault("chapter", "Unknown Chapter")
                rec.setdefault("concept", "")
                rec.setdefault("answer", "")

            if len(parsed_batch) < current_batch_size:
                issues = [
                    f"Batch {batch_index + 1}: insufficient unique questions generated ({len(parsed_batch)}/{current_batch_size})"
                ]
                continue

            parsed_batch = parsed_batch[:current_batch_size]
            break

        if len(parsed_batch) != current_batch_size:
            raise ValueError(
                f"Question bank batch {batch_index + 1} failed after retries. "
                f"Issues: {', '.join(issues[:8])}"
            )

        all_records.extend(parsed_batch)

    all_records = all_records[:total_questions]

    validation = validate_question_bank(
        questions=all_records,
        retrieved_context=context,
        total_questions=total_questions,
    )

    if not validation.get("valid"):
        raise ValueError(
            "Question bank validation failed. "
            f"Issues: {', '.join(validation.get('issues', [])[:10])}"
        )

    files = _write_question_bank_files(all_records, topic)

    return {
        "topic": topic,
        "book_id": book_id,
        "total_questions": total_questions,
        "quality_score": validation.get("quality_score", 0),
        "validation_passed": True,
        "difficulty_distribution": validation.get("difficulty_stats", {}),
        "bloom_distribution": validation.get("bloom_stats", {}),
        "question_type_distribution": validation.get("question_type_stats", {}),
        "files": files,
        "sample": all_records[:10],
    }
