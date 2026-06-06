from app.retrieval.indexer import index_book


if __name__ == "__main__":
    # Migration helper from old single-PDF setup to new multi-book architecture.
    result = index_book(
        pdf_path="uploads/class_6_Computational_thinking_AI.pdf",
        book_id="class6_ai",
        book_name="Class 6 AI",
        class_level="6",
    )
    print(result)
