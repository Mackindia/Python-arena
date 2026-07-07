const DEFAULT_API_BASE = process.env.NEXT_PUBLIC_EDUCATIONAL_AI_API_URL || "http://localhost:8000";

async function requestJSON<T>(path: string, options: RequestInit = {}, timeoutMs = 30_000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${DEFAULT_API_BASE}${path}`, {
      ...options,
      signal: controller.signal,
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
  } finally {
    clearTimeout(timer);
  }
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
  }, 300_000);
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
  }, 120_000);
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
  }, 120_000);
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
  }, 300_000);
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
  }, 120_000);
}

export {
  generateEducationalNotes as generateNotes,
  generateEducationalMcq as generateMCQs,
  generateEducationalQuestionBank as generateQuestionBank,
  generateEducationalWorksheet as generateWorksheet,
  searchEducationalKnowledge as searchTopic,
};

export async function generateEducationalLessonPlan(payload: {
  class_level: string;
  subject: string;
  topic: string;
  duration_minutes?: number;
  book_id?: string;
}) {
  return requestJSON<any>("/educational/generate/lesson-plan", {
    method: "POST",
    body: JSON.stringify(payload),
  }, 120_000);
}

export async function generateEducationalBloom(payload: {
  class_level: string;
  subject: string;
  topic: string;
  book_id?: string;
}) {
  return requestJSON<any>("/educational/generate/bloom", {
    method: "POST",
    body: JSON.stringify(payload),
  }, 120_000);
}

export async function generateEducationalConceptMap(payload: {
  class_level: string;
  subject: string;
  topic: string;
  book_id?: string;
}) {
  return requestJSON<any>("/educational/generate/concept-map", {
    method: "POST",
    body: JSON.stringify(payload),
  }, 120_000);
}

// ── Question Paper Intelligence ──────────────────────────────────────────────

export async function solveQuestionPaperUpload(formData: FormData) {
  return requestJSON<any>("/exam/solve-paper", {
    method: "POST",
    body: formData,
  }, 300_000);
}

export async function solveQuestionPaperTopic(payload: {
  class_level: string;
  subject: string;
  topic: string;
  book_id?: string;
  total_marks?: number;
}) {
  return requestJSON<any>("/exam/solve-topic", {
    method: "POST",
    body: JSON.stringify(payload),
  }, 300_000);
}

export async function generateExamPaper(payload: {
  class_level: string;
  subject: string;
  topic: string;
  book_id?: string;
  total_marks?: number;
  sections?: Array<{
    name: string;
    mark_type: number;
    count: number;
    required: number;
    internal_choice?: boolean;
  }>;
  topic_distribution?: Record<string, number>;
  difficulty_distribution?: Record<string, number>;
  difficulty_profile?: string;
  use_cbse_pattern?: boolean;
}) {
  return requestJSON<any>("/exam/generate-paper", {
    method: "POST",
    body: JSON.stringify(payload),
  }, 300_000);
}

export async function getCbseProfiles() {
  return requestJSON<any>("/exam/cbse-profiles");
}

export async function getMostImportantQuestions(params?: {
  class_level?: string;
  subject?: string;
}) {
  const query = new URLSearchParams();
  if (params?.class_level) query.set("class_level", params.class_level);
  if (params?.subject) query.set("subject", params.subject);
  const qs = query.toString();
  return requestJSON<any>(`/exam/most-important${qs ? `?${qs}` : ""}`, {}, 60_000);
}

export {
  solveQuestionPaperUpload as solvePaperUpload,
  solveQuestionPaperTopic as solvePaperTopic,
  generateExamPaper as generatePaper,
};

// ── Paper Management ─────────────────────────────────────────────────────────

export async function saveSolvedPaper(payload: {
  paper_data: any;
  class_level?: string;
  subject?: string;
  source?: string;
}) {
  return requestJSON<any>("/exam/save-paper", {
    method: "POST",
    body: JSON.stringify({
      paper_data: payload.paper_data,
      class_level: payload.class_level || "",
      subject: payload.subject || "",
      source: payload.source || "upload",
    }),
  });
}

export async function listSolvedPapers(params?: {
  class_level?: string;
  subject?: string;
}) {
  const query = new URLSearchParams();
  if (params?.class_level) query.set("class_level", params.class_level);
  if (params?.subject) query.set("subject", params.subject);
  const qs = query.toString();
  return requestJSON<any>(`/exam/papers${qs ? `?${qs}` : ""}`);
}

export async function getSolvedPaper(paperId: string) {
  return requestJSON<any>(`/exam/papers/${paperId}`);
}

export async function deleteSolvedPaper(paperId: string) {
  return requestJSON<any>(`/exam/papers/${paperId}`, { method: "DELETE" });
}

export async function analyzeCrossPaper(payload: { paper_ids: string[] }) {
  return requestJSON<any>("/exam/analyze-cross-paper", {
    method: "POST",
    body: JSON.stringify(payload),
  }, 300_000);
}

export async function exportPaper(payload: {
  paper_id: string;
  format: "pdf" | "docx" | "txt";
}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 120_000);
  try {
    const response = await fetch(`${DEFAULT_API_BASE}/exam/export`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!response.ok) {
      const msg = await response.text().catch(() => "");
      throw new Error(msg || `Export failed (${response.status})`);
    }
    const blob = await response.blob();
    const ext = payload.format === "pdf" ? "pdf" : payload.format === "docx" ? "docx" : "txt";
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${payload.paper_id}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    return { success: true };
  } finally {
    clearTimeout(timer);
  }
}

export async function exportPaperInline(payload: {
  data: any;
  format: "pdf" | "docx" | "txt";
}) {
  return requestJSON<any>("/exam/export-inline", {
    method: "POST",
    body: JSON.stringify({ data: payload.data, format: payload.format }),
  }, 120_000);
}
