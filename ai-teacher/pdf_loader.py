from langchain_community.document_loaders import PyPDFLoader

def load_pdf(pdf_path):
    loader = PyPDFLoader(pdf_path)
    pages = loader.load()
    return pages

if __name__ == "__main__":
    pages = load_pdf("uploads/sample.pdf")
    print(f"Loaded {len(pages)} pages")