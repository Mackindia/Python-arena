from pdf_loader import load_pdf
from chunker import create_chunks

pages = load_pdf("uploads/sample.pdf")

chunks = create_chunks(pages)

print(f"Pages: {len(pages)}")
print(f"Chunks: {len(chunks)}")

print("\nFirst Chunk:\n")
print(chunks[0].page_content[:500])