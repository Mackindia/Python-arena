from __future__ import annotations

from typing import Any

from langchain_core.documents import Document

from app.retrieval.indexer import INDEX_DIR, _load_or_create_index
from app.retrieval.reranker import DEFAULT_RERANKER_MODEL, rerank_documents


def _metadata_matches(
    doc: Document,
    book_id: str | None,
    class_level: str | None,
    chapter: str | None,
    subject: str | None,
) -> bool:
    metadata = doc.metadata or {}

    # Only serve indexed educational chunks, never internal bootstrap docs.
    if not str(metadata.get("book_id", "")).strip():
        return False

    if book_id and str(metadata.get("book_id", "")) != book_id:
        return False

    if class_level and str(metadata.get("class_level", "")) != str(class_level):
        return False

    if subject and str(metadata.get("subject", "")).strip().lower() != subject.strip().lower():
        return False

    if chapter:
        doc_chapter = str(metadata.get("chapter", "")).strip().lower()
        if chapter.strip().lower() not in doc_chapter:
            return False

    return True


def _dedupe_docs(docs: list[Document]) -> list[Document]:
    seen: set[str] = set()
    unique: list[Document] = []

    for doc in docs:
        key = f"{doc.metadata.get('book_id','')}::{doc.metadata.get('page','')}::{doc.page_content[:180]}"
        if key in seen:
            continue
        seen.add(key)
        unique.append(doc)

    return unique


def _search_candidates(query: str, k: int, search_type: str, fetch_k: int) -> list[Document]:
    index = _load_or_create_index()

    # Handle empty index case gracefully.
    if not index.index_to_docstore_id:
        return []

    if search_type.lower() == "mmr":
        try:
            return index.max_marginal_relevance_search(
                query,
                k=max(k, 1),
                fetch_k=max(fetch_k, k),
            )
        except Exception:
            # Fallback if MMR is unavailable for some FAISS versions.
            return index.similarity_search(query, k=max(fetch_k, k))

    return index.similarity_search(query, k=max(fetch_k, k))


def retrieve_documents(
    query: str,
    book_id: str | None = None,
    class_level: str | None = None,
    chapter: str | None = None,
    subject: str | None = None,
    k: int = 10,
    search_type: str = "mmr",
    fetch_k: int = 40,
    use_reranker: bool = True,
    rerank_top_n: int = 80,
    reranker_model: str = DEFAULT_RERANKER_MODEL,
) -> list[Document]:
    """
    Retrieve documents with optional metadata filters.

    Supported modes:
    - book-specific
    - class-level
    - chapter-specific
    - global search across all books
    """
    if not query.strip():
        raise ValueError("query is required")

    if not INDEX_DIR.exists():
        raise FileNotFoundError(
            "Multi-book index not found. Index at least one book using index_book first."
        )

    candidates = _search_candidates(query=query, k=max(k * 2, 12), search_type=search_type, fetch_k=fetch_k)

    filtered = [
        doc
        for doc in candidates
        if _metadata_matches(doc=doc, book_id=book_id, class_level=class_level, chapter=chapter, subject=subject)
    ]

    unique = _dedupe_docs(filtered)

    if len(unique) < k and search_type.lower() == "mmr":
        # Broaden search once more to fill remaining slots where filters are strict.
        fallback = _search_candidates(query=query, k=max(k * 4, 20), search_type="similarity", fetch_k=max(fetch_k * 2, 80))
        fallback_filtered = [
            doc
            for doc in fallback
            if _metadata_matches(doc=doc, book_id=book_id, class_level=class_level, chapter=chapter, subject=subject)
        ]
        unique = _dedupe_docs(unique + fallback_filtered)

    if use_reranker and unique:
        rerank_pool_size = max(k, min(max(rerank_top_n, k), len(unique)))
        pool = unique[:rerank_pool_size]
        reranked_docs, _ = rerank_documents(
            query=query,
            docs=pool,
            top_k=min(k, len(pool)),
            model_name=reranker_model,
        )
        return reranked_docs

    return unique[:k]


def retrieve_context(
    query: str,
    book_id: str | None = None,
    class_level: str | None = None,
    chapter: str | None = None,
    subject: str | None = None,
    k: int = 10,
    search_type: str = "mmr",
    fetch_k: int = 40,
    use_reranker: bool = True,
    rerank_top_n: int = 80,
    reranker_model: str = DEFAULT_RERANKER_MODEL,
) -> dict[str, Any]:
    """Return joined context + metadata for downstream generators."""
    docs = retrieve_documents(
        query=query,
        book_id=book_id,
        class_level=class_level,
        chapter=chapter,
        subject=subject,
        k=k,
        search_type=search_type,
        fetch_k=fetch_k,
        use_reranker=use_reranker,
        rerank_top_n=rerank_top_n,
        reranker_model=reranker_model,
    )

    reranker_info: dict[str, Any] = {
        "enabled": use_reranker,
        "model": reranker_model,
        "rerank_top_n": rerank_top_n,
    }
    if docs and docs[0].metadata and "rerank_score" in docs[0].metadata:
        reranker_info["applied"] = True
    else:
        reranker_info["applied"] = False

    context_blocks: list[str] = []
    sources: list[dict[str, Any]] = []
    for idx, doc in enumerate(docs, start=1):
        metadata = doc.metadata or {}
        context_blocks.append(f"[Chunk {idx}] {doc.page_content}")
        sources.append(
            {
                "chunk": idx,
                "book_id": metadata.get("book_id", ""),
                "book_name": metadata.get("book_name", ""),
                "chapter": metadata.get("chapter", ""),
                "page": metadata.get("page", ""),
                "source_file": metadata.get("source_file", ""),
                "class_level": metadata.get("class_level", ""),
                "snippet": doc.page_content[:260],
                "rerank_score": metadata.get("rerank_score"),
            }
        )

    return {
        "query": query,
        "filters": {
            "book_id": book_id,
            "class_level": class_level,
            "chapter": chapter,
            "subject": subject,
        },
        "search_type": search_type,
        "k": k,
        "retrieved_count": len(docs),
        "reranker": reranker_info,
        "context": "\n\n".join(context_blocks),
        "sources": sources,
    }
