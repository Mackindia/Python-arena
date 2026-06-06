from __future__ import annotations

from typing import Any

from app.retrieval.retriever import retrieve_context, retrieve_documents


def search(
    query: str,
    class_level: str | None = None,
    subject: str | None = None,
    chapter: str | None = None,
    book_id: str | None = None,
    k: int = 10,
) -> dict[str, Any]:
    context = retrieve_context(
        query=query,
        class_level=class_level,
        subject=subject,
        chapter=chapter,
        book_id=book_id,
        k=k,
        search_type="mmr",
        use_reranker=True,
        rerank_top_n=max(50, k * 4),
    )

    return {
        "chapter": chapter or (context["sources"][0]["chapter"] if context["sources"] else ""),
        "book": context["sources"][0]["book_name"] if context["sources"] else "",
        "results": context["sources"],
        "context": context["context"],
        "reranker": context.get("reranker", {}),
    }


def global_search(query: str, k: int = 10) -> dict[str, Any]:
    docs = retrieve_documents(query=query, k=k, search_type="mmr", use_reranker=True, rerank_top_n=max(50, k * 4))

    results = []
    for doc in docs:
        metadata = doc.metadata or {}
        results.append(
            {
                "book": metadata.get("book_name", ""),
                "chapter": metadata.get("chapter", ""),
                "subject": metadata.get("subject", ""),
                "class_level": metadata.get("class_level", ""),
                "page": metadata.get("page", ""),
                "score": metadata.get("rerank_score"),
                "snippet": doc.page_content[:280],
            }
        )

    return {"query": query, "results": results}
