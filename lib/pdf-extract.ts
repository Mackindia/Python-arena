import pdfParse from "pdf-parse";

export type PdfExtractionInput = {
  fileName?: string;
  mimeType?: string;
  maxBytes?: number;
};

export type PdfExtractionSuccess = {
  ok: true;
  text: string;
  pageCount: number;
  info?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

export type PdfExtractionFailureCode =
  | "INVALID_FILE"
  | "INVALID_MIME_TYPE"
  | "FILE_TOO_LARGE"
  | "EMPTY_TEXT"
  | "PARSE_ERROR";

export type PdfExtractionFailure = {
  ok: false;
  code: PdfExtractionFailureCode;
  message: string;
  cause?: unknown;
};

export type PdfExtractionResult = PdfExtractionSuccess | PdfExtractionFailure;

const DEFAULT_MAX_PDF_SIZE_BYTES = 25 * 1024 * 1024;
const PDF_MIME_TYPE = "application/pdf";

function normalizeBuffer(input: Buffer | Uint8Array | ArrayBuffer): Buffer {
  if (Buffer.isBuffer(input)) {
    return input;
  }

  if (input instanceof Uint8Array) {
    return Buffer.from(input);
  }

  return Buffer.from(input);
}

function isLikelyPdf(buffer: Buffer): boolean {
  if (buffer.length < 5) {
    return false;
  }

  return buffer.subarray(0, 5).toString("utf8") === "%PDF-";
}

function normalizeExtractedText(text: string): string {
  const cleaned = text
    .replace(/\u0000/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/[\t\f\v]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Za-z])(\d)/g, "$1 $2")
    .replace(/(\d)([A-Za-z])/g, "$1 $2")
    .replace(/([,.;:!?])(\S)/g, "$1 $2")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ ]{2,}/g, " ")
    .trim();

  return cleaned;
}

export async function extractTextFromPdf(
  input: Buffer | Uint8Array | ArrayBuffer,
  options: PdfExtractionInput = {},
): Promise<PdfExtractionResult> {
  try {
    const dataBuffer = normalizeBuffer(input);

    if (!dataBuffer || dataBuffer.length === 0) {
      return {
        ok: false,
        code: "INVALID_FILE",
        message: "PDF file is missing or empty.",
      };
    }

    const maxBytes = options.maxBytes ?? DEFAULT_MAX_PDF_SIZE_BYTES;
    if (dataBuffer.length > maxBytes) {
      return {
        ok: false,
        code: "FILE_TOO_LARGE",
        message: `PDF file exceeds allowed size (${maxBytes} bytes).`,
      };
    }

    if (options.mimeType && options.mimeType !== PDF_MIME_TYPE) {
      return {
        ok: false,
        code: "INVALID_MIME_TYPE",
        message: `Only ${PDF_MIME_TYPE} is supported for extraction.`,
      };
    }

    if (!isLikelyPdf(dataBuffer)) {
      return {
        ok: false,
        code: "INVALID_FILE",
        message: "Uploaded file does not appear to be a valid PDF.",
      };
    }

    const parsed = await pdfParse(dataBuffer);
    const cleanText = normalizeExtractedText(parsed.text ?? "");

    if (!cleanText) {
      return {
        ok: false,
        code: "EMPTY_TEXT",
        message: "No extractable text found in this PDF.",
      };
    }

    return {
      ok: true,
      text: cleanText,
      pageCount: parsed.numpages ?? 0,
      info: parsed.info as Record<string, unknown> | undefined,
      metadata: parsed.metadata as Record<string, unknown> | undefined,
    };
  } catch (error) {
    return {
      ok: false,
      code: "PARSE_ERROR",
      message: "Failed to parse PDF and extract text.",
      cause: error,
    };
  }
}
