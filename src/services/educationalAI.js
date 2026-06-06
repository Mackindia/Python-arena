const API_BASE = process.env.NEXT_PUBLIC_EDUCATIONAL_AI_API_URL || "http://localhost:8000";

async function parseResponse(response) {
  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { detail: text };
  }

  if (!response.ok) {
    const message = payload?.detail || payload?.error || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return payload;
}

async function call(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers || {}),
    },
    cache: "no-store",
  });

  return parseResponse(response);
}

export async function uploadBook({ file, bookName, classLevel, subject, bookId }) {
  const form = new FormData();
  form.append("file", file);
  form.append("book_name", bookName);
  form.append("class_level", classLevel);
  form.append("subject", subject);
  if (bookId) {
    form.append("book_id", bookId);
  }

  return call("/educational/books/upload", {
    method: "POST",
    body: form,
  });
}

export async function searchTopic({ classLevel, subject, query, chapter, bookId, k = 10 }) {
  return call("/educational/search", {
    method: "POST",
    body: JSON.stringify({
      class_level: classLevel,
      subject,
      query,
      chapter: chapter || undefined,
      book_id: bookId || undefined,
      k,
    }),
  });
}

export async function generateNotes({ classLevel, subject, topic, bookId }) {
  return call("/educational/generate/notes", {
    method: "POST",
    body: JSON.stringify({
      class_level: classLevel,
      subject,
      topic,
      book_id: bookId || undefined,
    }),
  });
}

export async function generateMCQs({ classLevel, subject, topic, difficulty, count, bookId }) {
  return call("/educational/generate/mcq", {
    method: "POST",
    body: JSON.stringify({
      class_level: classLevel,
      subject,
      topic,
      difficulty,
      count,
      book_id: bookId || undefined,
    }),
  });
}

export async function generateQuestionBank({ classLevel, subject, topic, count, bookId }) {
  return call("/educational/generate/question-bank", {
    method: "POST",
    body: JSON.stringify({
      class_level: classLevel,
      subject,
      topic,
      count,
      book_id: bookId || undefined,
    }),
  });
}

export async function generateWorksheet({ classLevel, subject, topic, bookId }) {
  return call("/educational/generate/worksheet", {
    method: "POST",
    body: JSON.stringify({
      class_level: classLevel,
      subject,
      topic,
      book_id: bookId || undefined,
    }),
  });
}

export async function getBooks() {
  return call("/educational/books", { method: "GET" });
}

export async function deleteBook(bookId) {
  return call(`/educational/books/${bookId}`, { method: "DELETE" });
}
