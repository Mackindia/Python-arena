"""
Quota Manager — Smart API call optimization for Gemini.

Implements:
- Response caching with TTL (avoids redundant calls)
- Model tiering (lite for simple tasks, fast for complex)
- Exponential backoff on retries
- Token budget tracking
- Request deduplication
"""

from __future__ import annotations

import hashlib
import json
import os
import re
import threading
import time
from collections import OrderedDict
from typing import Any

# ─── Response Cache ──────────────────────────────────────────────────────────

_cache_lock = threading.Lock()
_response_cache: OrderedDict[str, dict[str, Any]] = OrderedDict()
_CACHE_MAX_SIZE = 200
_DEFAULT_TTL_SECONDS = 3600  # 1 hour


def _cache_key(prompt: str, model_id: str) -> str:
    """Generate a deterministic cache key from prompt + model."""
    raw = f"{model_id}::{prompt}"
    return hashlib.sha256(raw.encode()).hexdigest()[:32]


def cache_get(prompt: str, model_id: str) -> dict[str, Any] | None:
    """Return cached response if exists and not expired. Returns None on miss."""
    key = _cache_key(prompt, model_id)
    with _cache_lock:
        entry = _response_cache.get(key)
        if entry and time.time() - entry["ts"] < entry["ttl"]:
            # Move to end (most recently used)
            _response_cache.move_to_end(key)
            return entry["data"]
        if entry:
            del _response_cache[key]
    return None


def cache_set(prompt: str, model_id: str, data: dict[str, Any], ttl: int = _DEFAULT_TTL_SECONDS) -> None:
    """Store response in cache with TTL."""
    key = _cache_key(prompt, model_id)
    with _cache_lock:
        if key in _response_cache:
            _response_cache.move_to_end(key)
        _response_cache[key] = {"data": data, "ts": time.time(), "ttl": ttl}
        while len(_response_cache) > _CACHE_MAX_SIZE:
            _response_cache.popitem(last=False)


def cache_clear() -> int:
    """Clear all cached responses. Returns count of items cleared."""
    with _cache_lock:
        count = len(_response_cache)
        _response_cache.clear()
    return count


def cache_stats() -> dict[str, Any]:
    """Return cache statistics."""
    with _cache_lock:
        return {
            "size": len(_response_cache),
            "max_size": _CACHE_MAX_SIZE,
            "ttl_seconds": _DEFAULT_TTL_SECONDS,
        }


# ─── Model Tiering ───────────────────────────────────────────────────────────

# Tasks that are simple enough for the lite model (saves quota)
LITE_MODEL_TASKS = {
    "extract_questions",   # Parsing structured text
    "validate",            # Checking if output is valid
    "detect_metadata",     # Regex-like classification
    "classify",            # Simple categorization
    "summarize_short",     # Short text summarization
}

# Tasks that need the fast model (default)
FAST_MODEL_TASKS = {
    "notes", "mcqs", "worksheet", "question_bank", "homework",
    "chat", "solve_question", "generate_answers", "pattern_analysis",
    "lesson_plan", "case_study", "concept_map", "bloom",
    "generate_paper", "cross_paper",
}


def select_model_tier(task: str, input_tokens: int = 0) -> str:
    """
    Select the most quota-efficient model tier for a task.
    
    Rules:
    - Simple tasks → lite (cheapest)
    - Complex generation → fast
    - Huge inputs → fast (lite has smaller output limit)
    - Unknown tasks → fast (safe default)
    """
    if task in LITE_MODEL_TASKS and input_tokens < 50_000:
        return "lite"
    if task in FAST_MODEL_TASKS:
        return "fast"
    return "fast"  # safe default


# ─── Exponential Backoff ─────────────────────────────────────────────────────

def get_backoff_delay(attempt: int, base_delay: float = 1.0, max_delay: float = 30.0) -> float:
    """
    Calculate exponential backoff delay with jitter.
    
    attempt 0 → ~1s, attempt 1 → ~2s, attempt 2 → ~4s, etc.
    """
    import random
    delay = min(base_delay * (2 ** attempt), max_delay)
    jitter = random.uniform(0.5, 1.5)
    return delay * jitter


# ─── Token Estimation ────────────────────────────────────────────────────────

def estimate_tokens(text: str) -> int:
    """
    Rough token estimate without calling the API.
    ~4 chars per token for English text (conservative estimate).
    """
    return max(1, len(text) // 4)


def compress_prompt(prompt: str, max_tokens: int = 8000) -> str:
    """
    Reduce prompt size while preserving essential information.
    Truncates context blocks that exceed the budget.
    """
    estimated = estimate_tokens(prompt)
    if estimated <= max_tokens:
        return prompt

    # Strategy 1: Truncate long context blocks
    # Find "Retrieved Context:" or similar markers and trim
    context_markers = ["Retrieved Context:", "Context:", "RETRIEVED CONTEXT"]
    for marker in context_markers:
        idx = prompt.find(marker)
        if idx != -1:
            before = prompt[:idx]
            after = prompt[idx + len(marker):]
            # Keep first 60% of context, truncate the rest
            keep_chars = int(len(after) * 0.6)
            trimmed = before + marker + after[:keep_chars] + "\n\n[Context truncated to save tokens]"
            return trimmed

    # Strategy 2: Remove excessive whitespace
    cleaned = re.sub(r"\n{3,}", "\n\n", prompt)
    cleaned = re.sub(r" {2,}", " ", cleaned)
    return cleaned


# ─── Request Deduplication ───────────────────────────────────────────────────

_inflight_requests: dict[str, threading.Event] = {}
_dedup_lock = threading.Lock()


def acquire_request(prompt: str, model_id: str) -> bool:
    """
    Try to acquire a lock for this prompt+model combination.
    Returns True if this is the first request (acquired lock).
    Returns False if a duplicate request is already in-flight (skip it).
    """
    key = _cache_key(prompt, model_id)
    with _dedup_lock:
        if key in _inflight_requests:
            return False
        _inflight_requests[key] = threading.Event()
        return True


def release_request(prompt: str, model_id: str) -> None:
    """Release the deduplication lock."""
    key = _cache_key(prompt, model_id)
    with _dedup_lock:
        event = _inflight_requests.pop(key, None)
        if event:
            event.set()


def wait_for_inflight(prompt: str, model_id: str, timeout: float = 60.0) -> dict[str, Any] | None:
    """
    Wait for an in-flight duplicate request to complete.
    Returns the result if it completes within timeout, None otherwise.
    """
    key = _cache_key(prompt, model_id)
    with _dedup_lock:
        event = _inflight_requests.get(key)
    if event:
        event.wait(timeout=timeout)
        # After wait, check cache
        return cache_get(prompt, model_id)
    return None
