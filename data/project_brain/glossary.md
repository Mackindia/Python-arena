# Project Glossary

This glossary defines terms, acronyms, and concepts specific to the `python-arena` project.

---

## Technical & AI Terms

### FAISS (Facebook AI Similarity Search)
A library developed by Meta's AI research group for efficient similarity search and clustering of dense vectors. In this project, FAISS is used to store and quickly query textbook chunk embeddings.

### Multi-Book Indexing
A design pattern used in the `ai-teacher` backend where all textbook chunks are indexed in a single FAISS vector database. Chunks are queried using metadata filters (e.g., matching a specific `book_id`, `class_level`, or `chapter`), eliminating the need to load separate indexes per textbook.

### MMR (Maximal Marginal Relevance)
A retrieval algorithm that balances query relevance with information diversity. In this project, MMR is used to filter out retrieved textbook chunks that contain duplicate or redundant information before sending them to the LLM.

### Reranker (Cross-Encoder)
An AI model (`cross-encoder/ms-marco-MiniLM-L-6-v2`) that evaluates the exact relationship between the user query and the retrieved textbook chunks. It assigns a `rerank_score` to each chunk, prioritizing the most contextually relevant information over simple vector similarity.

### Gemini API
Google's Generative AI API used in this codebase to generate notes, worksheets, and multiple-choice questions (MCQs) based on the retrieved textbook context.

---

## Domain & Platform Terms

### LMS (Learning Management System)
The portal in the frontend where students can access video lectures, read material, take quizzes, and track completion progress.

### Clerk
A third-party authentication and user management service used in the Next.js app to protect routes, authenticate users, and manage session states.

### MongoDB / Mongoose
MongoDB is a NoSQL database used to store lessons, user progress, and timetable data. Mongoose is the Object Data Modeling (ODM) library used by Next.js to communicate with MongoDB.

### Timetable Web App (Port 5173)
A standalone React web application built with Vite that provides a drag-and-drop grid interface for building school schedules. It coordinates periods, class sections, and teacher loads.
