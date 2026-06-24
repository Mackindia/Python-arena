from __future__ import annotations

from functools import lru_cache
from typing import Any

from langchain_core.documents import Document

DEFAULT_RERANKER_MODEL = "cross-encoder/ms-marco-MiniLM-L-6-v2"


@lru_cache(maxsize=2)
def _get_cross_encoder(model_name: str):
    """Lazy-load and cache cross-encoder model for retrieval-time reranking."""
    from sentence_transformers import CrossEncoder

    return CrossEncoder(model_name)


def rerank_documents(
    query: str,
    docs: list[Document],
    top_k: int,
    model_name: str = DEFAULT_RERANKER_MODEL,
) -> tuple[list[Document], dict[str, Any]]:
    """
    Rerank documents using a cross-encoder for higher precision.

    Falls back to original ranking if the reranker model cannot be loaded.
    Returns reranked docs and diagnostic metadata.
    """
    if not docs:
        return [], {
            "enabled": False,
            "model": model_name,
            "reason": "no_docs",
        }

    if not query.strip():
        return docs[:top_k], {
            "enabled": False,
            "model": model_name,
            "reason": "empty_query",
        }

    top_k = max(1, min(top_k, len(docs)))

    try:
        model = _get_cross_encoder(model_name)
        pairs = [(query, doc.page_content) for doc in docs]
        scores = model.predict(pairs, batch_size=32, show_progress_bar=False)

        scored = list(zip(docs, scores))
        scored.sort(key=lambda item: float(item[1]), reverse=True)

        reranked_docs: list[Document] = []
        for doc, score in scored[:top_k]:
            metadata = dict(doc.metadata or {})
            metadata["rerank_score"] = float(score)
            reranked_docs.append(Document(page_content=doc.page_content, metadata=metadata))

        return reranked_docs, {
            "enabled": True,
            "model": model_name,
            "input_docs": len(docs),
            "output_docs": len(reranked_docs),
        }

    except Exception as exc:
        # Graceful fallback: keep retrieval available even if reranker model fails.
        return docs[:top_k], {
            "enabled": False,
            "model": model_name,
            "reason": f"fallback:{exc.__class__.__name__}",
        }
