from pdf_loader import load_pdf
from chunker import create_chunks
from vector_store import create_vector_db

pages = load_pdf("uploads/class_6_Computational_thinking_AI.pdf")

chunks = create_chunks(pages)

db = create_vector_db(chunks)

print("FAISS index created successfully")