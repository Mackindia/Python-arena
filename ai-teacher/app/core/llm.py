# app/core/llm.py
# ─────────────────────────────────────────────────────────────────────────────
# SINGLE SOURCE OF TRUTH for all AI model configuration.
# Every feature in this project imports from here — never hardcode model names.
# ─────────────────────────────────────────────────────────────────────────────

import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

# ─── Model Registry ──────────────────────────────────────────────────────────
# Maps short names → full model IDs + token info for smart selection
MODEL_REGISTRY = {
    "fast": {
        "id": "gemini-2.5-flash",
        "input_token_limit": 1_048_576,   # ~750,000 words
        "output_token_limit": 65_536,     # ~50,000 words
        "best_for": ["notes", "mcqs", "homework", "chat"],
        "description": "Fastest model — use for most tasks"
    },
    "pro": {
        "id": "gemini-2.5-pro",
        "input_token_limit": 2_097_152,   # ~1.5 million words
        "output_token_limit": 65_536,
        "best_for": ["lesson_plan", "case_study", "complex_reasoning"],
        "description": "Most intelligent — use for complex generation"
    },
    "lite": {
        "id": "gemini-2.0-flash-lite",
        "input_token_limit": 1_048_576,
        "output_token_limit": 8_192,
        "best_for": ["simple_qa", "quick_checks"],
        "description": "Lightest model — use when speed matters most"
    }
}

# ─── Default model for our project ───────────────────────────────────────────
DEFAULT_MODEL = "fast"


def get_model(task: str = DEFAULT_MODEL) -> genai.GenerativeModel:
    """
    Returns a configured Gemini model for the given task.

    Usage:
        model = get_model("fast")       # for notes, MCQs
        model = get_model("pro")        # for lesson plans, case studies
        model = get_model("lite")       # for quick checks

    Raw Python equivalent (what LangChain abstracts away later):
        model = genai.GenerativeModel("gemini-2.5-flash")
    """
    config = MODEL_REGISTRY.get(task, MODEL_REGISTRY[DEFAULT_MODEL])
    return genai.GenerativeModel(config["id"])


def get_token_budget(task: str = DEFAULT_MODEL) -> dict:
    """
    Returns token limits for the selected model.
    Use this BEFORE sending large PDFs to check if they'll fit.

    Example:
        budget = get_token_budget("fast")
        if pdf_token_count > budget["safe_input_limit"]:
            # need to chunk the PDF
    """
    config = MODEL_REGISTRY.get(task, MODEL_REGISTRY[DEFAULT_MODEL])
    return {
        "model": config["id"],
        "input_token_limit": config["input_token_limit"],
        "output_token_limit": config["output_token_limit"],
        # safe limit = 80% of max (leave headroom for the model to "think")
        "safe_input_limit": int(config["input_token_limit"] * 0.8),
        "safe_output_limit": int(config["output_token_limit"] * 0.8),
        "best_for": config["best_for"],
    }


def get_registry() -> dict:
    """Returns the full model registry — used by the /models endpoint."""
    return MODEL_REGISTRY
