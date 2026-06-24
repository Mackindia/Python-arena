# Worksheet Generator

This module set adds a production-ready worksheet generation pipeline:

- `worksheet_generator.py`: retrieval -> generation -> validation -> formatting
- `worksheet_validator.py`: quality checks and distribution enforcement
- `worksheet_formatter.py`: human-readable worksheet + structured output payload

## Workflow

1. Retrieve topic-relevant chunks from FAISS index.
2. Generate worksheet JSON using Gemini.
3. Validate quality constraints.
4. Regenerate up to 3 attempts if validation fails.
5. Return both text worksheet and structured JSON.

## Endpoint

`POST /generate/worksheet`

Request body:

```json
{
  "topic": "Computational thinking",
  "grade_level": "class6",
  "difficulty": "medium-hard"
}
```

## Output

```json
{
  "worksheet": "...human-readable worksheet...",
  "worksheet_json": {
    "topic": "Computational thinking",
    "grade_level": "class6",
    "sections": {
      "section_a_mcqs": [],
      "section_b_fill_blanks": [],
      "section_c_short_answers": [],
      "section_d_long_answers": [],
      "section_e_application": [],
      "section_f_case_studies": []
    }
  },
  "quality_score": 95,
  "difficulty_distribution": {
    "Easy": 9,
    "Medium": 24,
    "Hard": 14
  },
  "bloom_distribution": {
    "Remember": 9,
    "Understand": 12,
    "Apply": 12,
    "Analyze": 7,
    "Evaluate": 5,
    "Create": 2
  },
  "validation_passed": true,
  "validation": {
    "valid": true,
    "issues": []
  }
}
```

## Notes

- Requires existing `faiss_index/` generated from textbook PDF.
- Uses strict source grounding checks via `source_evidence`.
- Keeps MCQ module untouched; worksheet logic is isolated.
- Ready for extension to PDF/DOCX export and dashboard integration.
