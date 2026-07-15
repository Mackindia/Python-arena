import json
import re
from functools import lru_cache
from typing import Any

from app.core.generator import _allocate_counts
from app.core.llm import get_model
from app.core.worksheet_formatter import build_structured_output, format_worksheet
from app.core.worksheet_validator import TOTAL_QUESTION_UNITS, build_distribution_targets, validate_worksheet


@lru_cache(maxsize=1)
def _get_vector_db():
    """Load FAISS index once per process for fast worksheet generation."""
    from langchain_community.embeddings import HuggingFaceEmbeddings
    from langchain_community.vectorstores import FAISS
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    return FAISS.load_local("faiss_index", embeddings, allow_dangerous_deserialization=True)


def _retrieve_relevant_context(topic: str, k: int = 14) -> dict[str, Any]:
    db = _get_vector_db()
    docs = db.similarity_search(topic, k=k)
    if not docs:
        raise ValueError("No relevant PDF chunks found for the requested topic.")

    context_parts = []
    sources = []
    for idx, doc in enumerate(docs, start=1):
        content = str(doc.page_content).strip()
        if not content:
            continue
        context_parts.append(f"[Chunk {idx}] {content}")
        sources.append({"chunk": idx, "metadata": doc.metadata})

    context = "\n\n".join(context_parts)
    if not context:
        raise ValueError("Retrieved chunks were empty. Rebuild the vector index from the PDF.")

    return {"context": context, "sources": sources}


def _extract_json_object(raw_text: str) -> dict[str, Any]:
    cleaned = raw_text.strip()
    fenced = re.search(r"```(?:json)?\s*(\{.*\})\s*```", cleaned, flags=re.DOTALL)
    if fenced:
        cleaned = fenced.group(1)

    if not cleaned.startswith("{"):
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start != -1 and end != -1 and end > start:
            cleaned = cleaned[start : end + 1]

    parsed = json.loads(cleaned)
    if not isinstance(parsed, dict):
        raise ValueError("Worksheet model output was not a JSON object")
    return parsed


def _build_worksheet_prompt(
    topic: str,
    grade_level: str,
    difficulty: str,
    context: str,
    targets: dict[str, dict[str, int]],
    attempt: int,
    previous_issues: list[str] | None = None,
) -> str:
    section_a_diff = _allocate_counts(10, {"Easy": 0.20, "Medium": 0.50, "Hard": 0.30})
    section_a_types = _allocate_counts(
        10,
        {
            "Concept Understanding": 0.25,
            "Application-Based": 0.25,
            "Analytical Thinking": 0.20,
            "Scenario-Based": 0.15,
            "Higher Order Thinking": 0.15,
        },
    )

    retry = ""
    if attempt > 1 and previous_issues:
        issues_text = "\n".join(f"- {issue}" for issue in previous_issues[:25])
        retry = (
            "\nThe previous worksheet failed validation. Fix ALL issues and regenerate fully.\n"
            f"Validation issues:\n{issues_text}\n"
        )

    return f"""
You are a Senior Educational Assessment Designer creating a classroom-ready worksheet.

Topic: {topic}
Grade Level: {grade_level}
Difficulty profile requested: {difficulty}
{retry}
MANDATORY RULES:
- Ground every question in RETRIEVED CONTEXT only.
- Do not hallucinate content not present in context.
- No duplicate or reworded duplicate questions.
- No repeated same-concept phrasing patterns.
- Keep academic quality suitable for real classroom use.

Worksheet structure (exact counts):
- section_a_mcqs: 10
- section_b_fill_blanks: 10
- section_c_short_answers: 8
- section_d_long_answers: 5
- section_e_application: 5
- section_f_case_studies: 3 case studies, each with exactly 3 questions

Section A MCQ constraints:
- Difficulty counts: Easy={section_a_diff['Easy']}, Medium={section_a_diff['Medium']}, Hard={section_a_diff['Hard']}
- Question type counts: Concept Understanding={section_a_types['Concept Understanding']}, Application-Based={section_a_types['Application-Based']}, Analytical Thinking={section_a_types['Analytical Thinking']}, Scenario-Based={section_a_types['Scenario-Based']}, Higher Order Thinking={section_a_types['Higher Order Thinking']}
- Keep options plausible with one clearly correct answer.

Global worksheet targets across all question units ({TOTAL_QUESTION_UNITS} total):
Difficulty:
- Easy: {targets['difficulty']['Easy']}
- Medium: {targets['difficulty']['Medium']}
- Hard: {targets['difficulty']['Hard']}
Bloom's Taxonomy:
- Remember: {targets['bloom']['Remember']}
- Understand: {targets['bloom']['Understand']}
- Apply: {targets['bloom']['Apply']}
- Analyze: {targets['bloom']['Analyze']}
- Evaluate: {targets['bloom']['Evaluate']}
- Create: {targets['bloom']['Create']}
Question Type:
- Concept Understanding: {targets['question_type']['Concept Understanding']}
- Application-Based: {targets['question_type']['Application-Based']}
- Analytical Thinking: {targets['question_type']['Analytical Thinking']}
- Scenario-Based: {targets['question_type']['Scenario-Based']}
- Higher Order Thinking: {targets['question_type']['Higher Order Thinking']}

Minimum constraints across complete worksheet:
- Application-Based questions >= 25%
- Scenario-Based questions >= 15%
- Higher Order Thinking questions >= 15%

Output only valid JSON object using this schema exactly:
{{
  "topic": "string",
  "grade_level": "string",
  "sections": {{
    "section_a_mcqs": [
      {{
        "question": "string",
        "options": {{"A": "string", "B": "string", "C": "string", "D": "string"}},
        "answer_letter": "A|B|C|D",
        "answer_text": "string",
        "explanation": "string",
        "difficulty": "Easy|Medium|Hard",
        "bloom_level": "Remember|Understand|Apply|Analyze|Evaluate|Create",
        "question_type": "Concept Understanding|Application-Based|Analytical Thinking|Scenario-Based|Higher Order Thinking",
        "source_evidence": "exact short phrase from context"
      }}
    ],
    "section_b_fill_blanks": [
      {{
        "question": "string with ________",
        "answer": "string",
        "difficulty": "Easy|Medium|Hard",
        "bloom_level": "Remember|Understand|Apply|Analyze|Evaluate|Create",
        "question_type": "Concept Understanding|Application-Based|Analytical Thinking|Scenario-Based|Higher Order Thinking",
        "source_evidence": "exact short phrase from context"
      }}
    ],
    "section_c_short_answers": [
      {{
        "question": "string",
        "answer_guidance": "2-5 line guidance",
        "difficulty": "Easy|Medium|Hard",
        "bloom_level": "Remember|Understand|Apply|Analyze|Evaluate|Create",
        "question_type": "Concept Understanding|Application-Based|Analytical Thinking|Scenario-Based|Higher Order Thinking",
        "source_evidence": "exact short phrase from context"
      }}
    ],
    "section_d_long_answers": [
      {{
        "question": "string",
        "answer_guidance": "8-15 line guidance",
        "difficulty": "Easy|Medium|Hard",
        "bloom_level": "Remember|Understand|Apply|Analyze|Evaluate|Create",
        "question_type": "Concept Understanding|Application-Based|Analytical Thinking|Scenario-Based|Higher Order Thinking",
        "source_evidence": "exact short phrase from context"
      }}
    ],
    "section_e_application": [
      {{
        "question": "string",
        "answer_guidance": "string",
        "difficulty": "Easy|Medium|Hard",
        "bloom_level": "Remember|Understand|Apply|Analyze|Evaluate|Create",
        "question_type": "Application-Based|Scenario-Based|Higher Order Thinking|Analytical Thinking|Concept Understanding",
        "source_evidence": "exact short phrase from context"
      }}
    ],
    "section_f_case_studies": [
      {{
        "scenario": "string",
        "questions": [
          {{
            "question": "string",
            "answer_guidance": "string",
            "difficulty": "Easy|Medium|Hard",
            "bloom_level": "Remember|Understand|Apply|Analyze|Evaluate|Create",
            "question_type": "Concept Understanding|Application-Based|Analytical Thinking|Scenario-Based|Higher Order Thinking",
            "source_evidence": "exact short phrase from context"
          }}
        ]
      }}
    ]
  }}
}}

RETRIEVED CONTEXT (the only allowed source):
{context}
"""


def generate_worksheet(
    topic: str,
    grade_level: str = "class6",
    difficulty: str = "medium-hard",
) -> dict[str, Any]:
    """Generate a validated, teacher-ready worksheet from retrieved PDF chunks."""
    retrieval = _retrieve_relevant_context(topic=topic, k=14)
    context = retrieval["context"]

    model = get_model("fast")
    targets = build_distribution_targets(TOTAL_QUESTION_UNITS)

    last_issues: list[str] = []
    parsed_worksheet: dict[str, Any] | None = None
    validation: dict[str, Any] = {"valid": False, "issues": []}

    for attempt in range(1, 4):
        prompt = _build_worksheet_prompt(
            topic=topic,
            grade_level=grade_level,
            difficulty=difficulty,
            context=context,
            targets=targets,
            attempt=attempt,
            previous_issues=last_issues,
        )

        response = model.generate_content(prompt)
        raw_text = response.text or ""

        try:
            parsed_worksheet = _extract_json_object(raw_text)
        except Exception as ex:
            last_issues = [f"JSON parse failure: {ex}"]
            continue

        # Ensure top-level identifiers are set consistently.
        parsed_worksheet["topic"] = topic
        parsed_worksheet["grade_level"] = grade_level

        validation = validate_worksheet(
            worksheet=parsed_worksheet,
            retrieved_context=context,
            expected_targets=targets,
        )

        if validation.get("valid"):
            worksheet_text = format_worksheet(parsed_worksheet)
            payload = build_structured_output(
                worksheet_json=parsed_worksheet,
                validation=validation,
                worksheet_text=worksheet_text,
            )
            payload["retrieval"] = {
                "source_chunks": retrieval["sources"],
                "retrieved_context_preview": context[:1200],
            }
            payload["difficulty"] = difficulty
            payload["grade_level"] = grade_level
            payload["topic"] = topic
            payload["attempts"] = attempt
            return payload

        last_issues = validation.get("issues", [])

    raise ValueError(
        "Worksheet generation failed validation after 3 attempts. "
        f"Top issues: {', '.join(last_issues[:8])}"
    )
