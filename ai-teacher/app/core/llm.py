# app/core/llm.py
# ─────────────────────────────────────────────────────────────────────────────
# SINGLE SOURCE OF TRUTH for all AI model configuration.
# Every feature in this project imports from here — never hardcode model names.
#
# Quota-saving features:
# - Response caching (avoids redundant API calls)
# - Model tiering (lite for simple tasks, fast for complex)
# - Exponential backoff on retries
# - Prompt compression
# ─────────────────────────────────────────────────────────────────────────────

import google.generativeai as genai
import os
import time
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

from app.core.quota_manager import (
    cache_get, cache_set, cache_stats,
    select_model_tier, get_backoff_delay,
    estimate_tokens, compress_prompt,
    acquire_request, release_request, wait_for_inflight,
)

# ─── Model Registry ──────────────────────────────────────────────────────────
MODEL_REGISTRY = {
    "fast": {
        "id": "gemini-2.5-flash",
        "input_token_limit": 1_048_576,
        "output_token_limit": 65_536,
        "best_for": ["notes", "mcqs", "worksheet", "question_bank", "chat"],
        "description": "Fastest model — use for most tasks",
    },
    "pro": {
        "id": "gemini-2.5-pro",
        "input_token_limit": 2_097_152,
        "output_token_limit": 65_536,
        "best_for": ["lesson_plan", "case_study", "complex_reasoning"],
        "description": "Most intelligent — use for complex generation",
    },
    "lite": {
        "id": "gemini-2.0-flash-lite",
        "input_token_limit": 1_048_576,
        "output_token_limit": 8_192,
        "best_for": ["simple_qa", "quick_checks", "extraction", "validation"],
        "description": "Lightest model — use when speed matters most",
    },
}

DEFAULT_MODEL = "fast"


def get_model(task: str = DEFAULT_MODEL) -> genai.GenerativeModel:
    """
    Returns a configured Gemini model for the given task tier.
    
    Usage:
        model = get_model("fast")       # for notes, MCQs
        model = get_model("pro")        # for lesson plans
        model = get_model("lite")       # for extraction, validation
    """
    config = MODEL_REGISTRY.get(task, MODEL_REGISTRY[DEFAULT_MODEL])
    return genai.GenerativeModel(config["id"])


def get_model_for_task(task: str, prompt: str = "") -> tuple[genai.GenerativeModel, str]:
    """
    Smart model selection: picks the most quota-efficient model for the task.
    
    Returns (model, tier_name) tuple.
    """
    tokens = estimate_tokens(prompt) if prompt else 0
    tier = select_model_tier(task, tokens)
    return get_model(tier), tier


def get_token_budget(task: str = DEFAULT_MODEL) -> dict:
    """Returns token limits for the selected model."""
    config = MODEL_REGISTRY.get(task, MODEL_REGISTRY[DEFAULT_MODEL])
    return {
        "model": config["id"],
        "input_token_limit": config["input_token_limit"],
        "output_token_limit": config["output_token_limit"],
        "safe_input_limit": int(config["input_token_limit"] * 0.8),
        "safe_output_limit": int(config["output_token_limit"] * 0.8),
        "best_for": config["best_for"],
    }


def get_registry() -> dict:
    """Returns the full model registry."""
    return MODEL_REGISTRY


# ─── Smart Generate with Cache + Backoff ─────────────────────────────────────

def smart_generate(
    prompt: str,
    task: str = "fast",
    cache_ttl: int = 3600,
    max_retries: int = 2,
    use_cache: bool = True,
) -> str:
    """
    Generate content with all quota-saving features:
    
    1. Check cache first (skip API call if hit)
    2. Compress prompt if too long (reduce tokens)
    3. Deduplicate concurrent requests (prevent duplicate calls)
    4. Exponential backoff on retries (prevent burst consumption)
    
    Returns the response text.
    """
    # Step 1: Check cache
    model_config = MODEL_REGISTRY.get(task, MODEL_REGISTRY[DEFAULT_MODEL])
    model_id = model_config["id"]
    
    if use_cache:
        cached = cache_get(prompt, model_id)
        if cached:
            return cached.get("text", "")

    # Step 2: Compress prompt if needed
    compressed = compress_prompt(prompt, max_tokens=8000)

    # Step 3: Deduplicate concurrent requests
    if not acquire_request(compressed, model_id):
        # Another request for same prompt is in-flight — wait for it
        result = wait_for_inflight(compressed, model_id, timeout=90)
        if result:
            return result.get("text", "")
        # If wait failed, proceed with our own request

    try:
        # Step 4: Generate with backoff
        model = get_model(task)
        last_error = None

        for attempt in range(max_retries + 1):
            try:
                response = model.generate_content(compressed)
                text = response.text or ""

                # Cache successful response
                if use_cache and text:
                    cache_set(compressed, model_id, {"text": text}, ttl=cache_ttl)

                return text

            except Exception as e:
                last_error = e
                error_str = str(e).lower()

                # Don't retry on quota errors — fail fast
                if "429" in error_str or "quota" in error_str or "resourceexhausted" in error_str:
                    raise

                if attempt < max_retries:
                    delay = get_backoff_delay(attempt)
                    time.sleep(delay)

        raise last_error or Exception("Generation failed after all retries")

    finally:
        release_request(compressed, model_id)


def get_quota_stats() -> dict:
    """Return quota usage statistics."""
    return {
        "cache": cache_stats(),
        "models": {k: v["id"] for k, v in MODEL_REGISTRY.items()},
        "default": DEFAULT_MODEL,
    }
