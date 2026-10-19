"""OCR pipeline for typed and handwritten question papers."""

from __future__ import annotations

import os
import re
import tempfile
import time

from PIL import Image, ImageEnhance, ImageFilter

# Tesseract availability is probed once per process (the probe costs ~200ms).
_TESSERACT_STATE: dict[str, bool] = {}

_GEMINI_OCR_PROMPT = """You are an expert exam-paper transcriber. Transcribe EVERY word of this question-paper page.

Rules:
- Keep the original question numbers, section headings (SECTION A / SECTION B...), and marks hints such as [2] or "Max Marks: 80".
- Write in the SAME language as the paper (English, Hindi, or mixed). Do not translate.
- Do NOT answer the questions. Do NOT summarise. Do NOT add any commentary or headings of your own.
- If a word is truly illegible, write your best guess inside [?].
- Output ONLY the transcribed text."""


def _log(message: str) -> None:
    print(f"[ocr] {message}")


def _preprocess_image(img: Image.Image) -> Image.Image:
    """Enhance image for better OCR accuracy."""
    img = img.convert("L")
    img = ImageEnhance.Contrast(img).enhance(2.0)
    img = ImageEnhance.Sharpness(img).enhance(2.0)
    img = img.filter(ImageFilter.MedianFilter(size=3))
    return img


def detect_paper_type(pdf_path: str) -> str:
    """Detect if PDF is typed (selectable text) or scanned (needs OCR)."""
    try:
        import fitz
        doc = fitz.open(pdf_path)
        total_text = ""
        for page in doc:
            total_text += page.get_text() or ""
        doc.close()
        return "typed" if len(total_text.strip()) > 100 else "scanned"
    except Exception:
        return "scanned"


def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract text from typed PDF, or OCR scanned PDFs page by page."""
    paper_type = detect_paper_type(pdf_path)

    if paper_type == "typed":
        return _extract_typed_pdf(pdf_path)

    return _ocr_pdf(pdf_path)


def extract_text_from_image(image_path: str) -> str:
    """OCR a single image (handwritten paper photo) via Tesseract or Gemini."""
    img = Image.open(image_path)
    return _ocr_image(img, page_label=os.path.basename(image_path))


def extract_text_from_file(file_path: str) -> str:
    """Route to correct extractor based on file type."""
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".pdf":
        return extract_text_from_pdf(file_path)
    if ext in (".png", ".jpg", ".jpeg", ".bmp", ".tiff", ".webp"):
        return extract_text_from_image(file_path)
    raise ValueError(f"Unsupported file type: {ext}")


def detect_paper_metadata(raw_text: str) -> dict[str, str]:
    """
    Auto-detect class, subject, and topic from OCR text using regex patterns.
    Returns dict with keys: class_level, subject, topic (empty string if not detected).
    """
    result = {"class_level": "", "subject": "", "topic": ""}
    text_lower = raw_text[:3000].lower()  # only check first 3000 chars (header area)

    # Detect class level
    class_patterns = [
        r"(?:class|grade|standard)\s*(\d{1,2})",
        r"(\d{1,2})\s*(?:th|st|nd|rd)\s*(?:class|grade|standard)",
        r"cbse\s*(?:class|grade)\s*(\d{1,2})",
        r"(\d{1,2})\s*-\s*(?:class|grade)",
    ]
    for pat in class_patterns:
        m = re.search(pat, text_lower)
        if m:
            num = m.group(1)
            if 1 <= int(num) <= 12:
                result["class_level"] = f"Class {num}"
                break

    # Detect subject
    subject_keywords = {
        "mathematics": "Mathematics", "maths": "Mathematics", "math": "Mathematics",
        "science": "Science", "physics": "Physics", "chemistry": "Chemistry",
        "biology": "Biology", "english": "English", "hindi": "Hindi",
        "social science": "Social Science", "history": "History",
        "geography": "Geography", "civics": "Civics", "political science": "Political Science",
        "computer": "Computer Science", "computational thinking": "Computational Thinking",
        "information technology": "Information Technology", "it": "Information Technology",
        "economics": "Economics", "business studies": "Business Studies",
        "accountancy": "Accountancy", "psychology": "Psychology",
        "sociology": "Sociology", "philosophy": "Philosophy",
    }
    for keyword, subject_name in subject_keywords.items():
        if keyword in text_lower:
            result["subject"] = subject_name
            break

    # Detect topic from common header patterns
    topic_patterns = [
        r"(?:topic|chapter|unit|module)\s*[:\-]\s*(.+?)(?:\n|$)",
        r"(?:subject|paper)\s*[:\-]\s*(.+?)(?:\n|$)",
    ]
    for pat in topic_patterns:
        m = re.search(pat, text_lower)
        if m:
            topic = m.group(1).strip()[:80]
            if len(topic) > 3:
                result["topic"] = topic.title()
                break

    return result


# ── Internal helpers ──────────────────────────────────────────────────────────


def _extract_typed_pdf(pdf_path: str) -> str:
    """Extract selectable text from a typed PDF."""
    import fitz

    doc = fitz.open(pdf_path)
    pages = []
    for i, page in enumerate(doc):
        text = page.get_text()
        if text.strip():
            pages.append(f"[Page {i + 1}]\n{text}")
    doc.close()
    return "\n\n".join(pages)


def _ocr_pdf(pdf_path: str) -> str:
    """OCR a scanned PDF: local Tesseract when installed, otherwise Gemini vision."""
    images = _render_pdf_pages(pdf_path, dpi=300)
    if not images:
        raise RuntimeError("No pages could be rendered from the PDF.")

    use_tesseract = _tesseract_available()
    if not use_tesseract:
        if not _gemini_available():
            raise RuntimeError(
                "No OCR engine available for this scanned PDF: Tesseract is not installed "
                "and GOOGLE_API_KEY is not set. Either install Tesseract-OCR "
                "(https://github.com/UB-Mannheim/tesseract/wiki) or add GOOGLE_API_KEY to ai-teacher/.env"
            )
        _log(f"{len(images)} scanned page(s): Tesseract not installed, using Gemini vision OCR")

    pages: list[str] = []
    empty_pages = 0

    for i, img in enumerate(images, start=1):
        label = f"page {i}/{len(images)}"

        if use_tesseract:
            text = _ocr_with_tesseract(img)
            # Tesseract returns nothing for scripts it has no data for (Hindi,
            # handwriting) — retry just that page with Gemini instead of failing.
            if not text.strip():
                fallback = _try_gemini_ocr(img, label)
                if fallback:
                    text = fallback
                else:
                    empty_pages += 1
                    _log(f"{label}: Tesseract returned no text and Gemini fallback unavailable")
        else:
            text = _ocr_with_gemini(img, label)

        pages.append(f"[Page {i}]\n{text}")

    if empty_pages == len(images):
        raise RuntimeError(
            "OCR produced no text from the scanned PDF. Install Tesseract-OCR with its "
            "language data, or set GOOGLE_API_KEY so Gemini vision OCR can be used."
        )

    return "\n\n".join(pages)


def _ocr_image(img: Image.Image, page_label: str) -> str:
    """OCR one image, preferring Tesseract and falling back to Gemini vision."""
    if _tesseract_available():
        text = _ocr_with_tesseract(img)
        if text.strip():
            return text
        fallback = _try_gemini_ocr(img, page_label)
        if fallback:
            return fallback
        raise RuntimeError(
            f"OCR produced no text from {page_label}. Install Tesseract-OCR with its "
            "language data, or set GOOGLE_API_KEY so Gemini vision OCR can be used."
        )

    if not _gemini_available():
        raise RuntimeError(
            "OCR dependencies not available. Install Tesseract-OCR, or add GOOGLE_API_KEY "
            "to ai-teacher/.env to use Gemini vision OCR."
        )
    _log(f"{page_label}: Tesseract not installed, using Gemini vision OCR")
    return _ocr_with_gemini(img, page_label)


# ── OCR engine internals ─────────────────────────────────────────────────────


def _tesseract_available() -> bool:
    """True when both pytesseract and the Tesseract binary are usable."""
    if "ok" in _TESSERACT_STATE:
        return _TESSERACT_STATE["ok"]

    ok = False
    try:
        import pytesseract

        pytesseract.get_tesseract_version()  # raises when the binary is missing
        ok = True
    except Exception:
        ok = False

    _TESSERACT_STATE["ok"] = ok
    return ok


def _gemini_available() -> bool:
    """True when Gemini vision OCR can run.

    Importing app.core.llm is what loads ai-teacher/.env (load_dotenv), so we
    touch it first — otherwise GOOGLE_API_KEY looks unset when this module is
    imported on its own, e.g. by a script or a test.
    """
    try:
        from app.core import llm  # noqa: F401 - import has the load_dotenv side effect
    except Exception:
        pass
    return bool(os.getenv("GOOGLE_API_KEY"))


def _render_pdf_pages(pdf_path: str, dpi: int = 300) -> list[Image.Image]:
    """Rasterise PDF pages with PyMuPDF — replaces pdf2image, so poppler is not needed."""
    import fitz

    doc = fitz.open(pdf_path)
    images: list[Image.Image] = []
    try:
        for page in doc:
            pix = page.get_pixmap(dpi=dpi)
            images.append(Image.frombytes("RGB", (pix.width, pix.height), pix.samples))
    finally:
        doc.close()
    return images


def _ocr_with_tesseract(img: Image.Image) -> str:
    import pytesseract

    return pytesseract.image_to_string(_preprocess_image(img), config="--psm 6 --oem 1").strip()


def _try_gemini_ocr(img: Image.Image, page_label: str) -> str:
    """Gemini vision OCR that returns "" instead of raising (used as a fallback)."""
    try:
        return _ocr_with_gemini(img, page_label)
    except Exception as exc:  # noqa: BLE001 - fallback must never mask the primary error
        _log(f"{page_label}: Gemini OCR fallback failed: {exc}")
        return ""


def _ocr_with_gemini(img: Image.Image, page_label: str) -> str:
    """Transcribe one page image with Gemini. Fails fast on quota errors."""
    from app.core.llm import get_model

    last_error: Exception | None = None

    for attempt in range(2):
        try:
            model = get_model("fast")
            response = model.generate_content(
                [_GEMINI_OCR_PROMPT, img],
                generation_config={"temperature": 0.0},
            )
            text = (response.text or "").strip()
            if text:
                _log(f"{page_label}: transcribed with Gemini ({len(text)} chars)")
            return text
        except Exception as exc:  # noqa: BLE001 - re-raised below with page context
            last_error = exc
            err = str(exc).lower()
            if "429" in err or "quota" in err or "resourceexhausted" in err:
                raise
            if attempt == 0:
                time.sleep(2)

    raise RuntimeError(f"Gemini vision OCR failed on {page_label}: {last_error}")
