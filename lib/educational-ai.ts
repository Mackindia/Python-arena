const DEFAULT_API_BASE = process.env.NEXT_PUBLIC_EDUCATIONAL_AI_API_URL || "http://localhost:8000";

async function requestJSON<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${DEFAULT_API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export type EducationalBookRecord = {
  book_id: string;
  book_name: string;
  class_level: string;
  subject: string;
  chapters: Array<{ chapter_number: number; chapter_name: string; start_page?: number; end_page?: number }>;
  indexed_at: string;
  source_file: string;
  chunk_count: number;
};

export async function uploadEducationalBook(formData: FormData) {
  return requestJSON<{ success: boolean; book_id: string; chunks: number }>("/educational/books/upload", {
    method: "POST",
    body: formData,
  });
}

export async function listEducationalBooks() {
  const data = await requestJSON<{ books: EducationalBookRecord[] }>("/educational/books");
  return data.books;
}

export async function searchEducationalKnowledge(payload: {
  class_level?: string;
  subject?: string;
  query: string;
  chapter?: string;
  book_id?: string;
  k?: number;
}) {
  return requestJSON<any>("/educational/search", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function searchEducationalGlobal(query: string) {
  return requestJSON<any>("/educational/search/global", {
    method: "POST",
    body: JSON.stringify({ query }),
  });
}

export async function generateEducationalNotes(payload: {
  class_level: string;
  subject: string;
  topic: string;
  book_id?: string;
}) {
  return requestJSON<any>("/educational/generate/notes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function generateEducationalMcq(payload: {
  class_level: string;
  subject: string;
  topic: string;
  difficulty?: "easy" | "medium" | "hard";
  count?: number;
  book_id?: string;
}) {
  return requestJSON<any>("/educational/generate/mcq", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function generateEducationalQuestionBank(payload: {
  class_level: string;
  subject: string;
  topic: string;
  count?: number;
  book_id?: string;
}) {
  return requestJSON<any>("/educational/generate/question-bank", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function generateEducationalWorksheet(payload: {
  class_level: string;
  subject: string;
  topic: string;
  book_id?: string;
}) {
  return requestJSON<any>("/educational/generate/worksheet", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
