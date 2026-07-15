import os

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def save_pdf(file_bytes: bytes, filename: str) -> str:
    """Save uploaded PDF bytes to disk. Returns the saved file path."""
    safe_name = filename.replace(" ", "_")
    file_path = os.path.join(UPLOAD_DIR, safe_name)
    with open(file_path, "wb") as f:
        f.write(file_bytes)
    return file_path


def extract_text(file_path: str) -> dict:
    """
    Extract all text from a PDF file.

    Raw Python — no frameworks. This is exactly what LangChain's
    PyMuPDFLoader does internally, minus the Document wrapper.

    Returns:
        text           - full extracted text (one big string)
        pages          - total page count
        characters     - character count
        estimated_tokens - rough token count (chars / 4)
        fits_in_model  - whether it fits safely in gemini-2.5-flash
    """
    import fitz  # PyMuPDF — installed as 'pymupdf', imported as 'fitz'
    doc = fitz.open(file_path)
    full_text = ""
    page_count = len(doc)       # ← save BEFORE closing

    for page in doc:
        full_text += page.get_text()

    doc.close()                 # ← now safe to close

    char_count = len(full_text)
    estimated_tokens = char_count // 4
    safe_limit = 838_860

    return {
        "text": full_text,
        "pages": page_count,    # ← use saved value, not doc.page_count
        "characters": char_count,
        "estimated_tokens": estimated_tokens,
        "fits_in_model": estimated_tokens < safe_limit,
        "file_path": file_path,
    }
