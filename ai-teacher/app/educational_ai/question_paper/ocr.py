"""OCR pipeline for typed and handwritten question papers."""

from __future__ import annotations

import os
import re
import tempfile

from PIL import Image, ImageEnhance, ImageFilter


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
    """OCR a single image (handwritten paper photo)."""
    try:
        import pytesseract
    except ImportError:
        raise RuntimeError("pytesseract not installed. Run: pip install pytesseract")

    img = Image.open(image_path)
    img = _preprocess_image(img)
    text = pytesseract.image_to_string(img, config="--psm 6 --oem 1")
    return text


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
    """Convert scanned PDF to images, then OCR each page."""
    try:
        import pytesseract
        from pdf2image import convert_from_path
    except ImportError:
        raise RuntimeError(
            "OCR dependencies not installed. Run: pip install pytesseract pdf2image"
        )

    images = convert_from_path(pdf_path, dpi=300)
    pages = []
    for i, img in enumerate(images):
        img = _preprocess_image(img)
        text = pytesseract.image_to_string(img, config="--psm 6 --oem 1")
        pages.append(f"[Page {i + 1}]\n{text}")
    return "\n\n".join(pages)
