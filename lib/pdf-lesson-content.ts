import { extractTextFromPdf, type PdfExtractionResult } from "@/lib/pdf-extract";

export type LessonPdfProcessingInput = {
  pdfUrl: string;
  maxFetchBytes?: number;
  fetchTimeoutMs?: number;
};

export type LessonPdfProcessingSuccess = {
  ok: true;
  extractedText: string;
  pageCount: number;
  extractedAt: Date;
  sourceUrl: string;
};

export type LessonPdfProcessingFailure = {
  ok: false;
  message: string;
  sourceUrl: string;
  errorCode?: string;
};

export type LessonPdfProcessingResult = LessonPdfProcessingSuccess | LessonPdfProcessingFailure;

const DEFAULT_FETCH_TIMEOUT_MS = 15_000;
const DEFAULT_MAX_FETCH_BYTES = 30 * 1024 * 1024;

async function fetchPdfBuffer(
  url: string,
  maxFetchBytes: number,
  fetchTimeoutMs: number,
): Promise<Buffer> {
  const response = await fetch(url, {
    method: "GET",
    signal: AbortSignal.timeout(fetchTimeoutMs),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch PDF: HTTP ${response.status}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType && !contentType.includes("application/pdf") && !contentType.includes("application/octet-stream")) {
    throw new Error(`Invalid PDF content type: ${contentType}`);
  }

  const contentLengthHeader = response.headers.get("content-length");
  if (contentLengthHeader) {
    const contentLength = Number(contentLengthHeader);
    if (Number.isFinite(contentLength) && contentLength > maxFetchBytes) {
      throw new Error(`PDF exceeds max allowed size (${maxFetchBytes} bytes)`);
    }
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (buffer.length > maxFetchBytes) {
    throw new Error(`PDF exceeds max allowed size (${maxFetchBytes} bytes)`);
  }

  return buffer;
}

function toFailure(
  result: PdfExtractionResult,
  sourceUrl: string,
): LessonPdfProcessingFailure {
  if (result.ok) {
    return {
      ok: false,
      message: "Unexpected extraction result",
      sourceUrl,
    };
  }

  return {
    ok: false,
    message: result.message,
    sourceUrl,
    errorCode: result.code,
  };
}

export async function processLessonPdfContent(
  input: LessonPdfProcessingInput,
): Promise<LessonPdfProcessingResult> {
  const sourceUrl = input.pdfUrl.trim();
  const maxFetchBytes = input.maxFetchBytes ?? DEFAULT_MAX_FETCH_BYTES;
  const fetchTimeoutMs = input.fetchTimeoutMs ?? DEFAULT_FETCH_TIMEOUT_MS;

  if (!sourceUrl) {
    return {
      ok: false,
      message: "PDF URL is required for extraction.",
      sourceUrl,
      errorCode: "INVALID_FILE",
    };
  }

  try {
    const pdfBuffer = await fetchPdfBuffer(sourceUrl, maxFetchBytes, fetchTimeoutMs);
    const extraction = await extractTextFromPdf(pdfBuffer, {
      fileName: "lesson.pdf",
      mimeType: "application/pdf",
      maxBytes: maxFetchBytes,
    });

    if (!extraction.ok) {
      return toFailure(extraction, sourceUrl);
    }

    return {
      ok: true,
      extractedText: extraction.text,
      pageCount: extraction.pageCount,
      extractedAt: new Date(),
      sourceUrl,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Unknown PDF processing error",
      sourceUrl,
      errorCode: "PARSE_ERROR",
    };
  }
}
