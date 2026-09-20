import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function sanitizeError(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message;
    if (msg.includes("ECONNREFUSED") || msg.includes("ENOTFOUND")) return "Service temporarily unavailable";
    if (msg.includes("ETIMEOUT") || msg.includes("ETIMEDOUT")) return "Request timed out";
    if (msg.includes("duplicate key")) return "Resource already exists";
    if (msg.includes("ValidationError")) return "Invalid input data";
    if (msg.includes("CastError")) return "Invalid resource ID";
    if (process.env.NODE_ENV === "production") return "An unexpected error occurred";
    return msg;
  }
  return "An unexpected error occurred";
}

const BLOCKED_IPS = new Set<string>();
const REQUEST_COUNTS = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(ip: string, maxRequests = 100, windowMs = 60000): boolean {
  if (BLOCKED_IPS.has(ip)) return false;
  const now = Date.now();
  const record = REQUEST_COUNTS.get(ip);
  if (!record || now > record.resetAt) {
    REQUEST_COUNTS.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  record.count++;
  if (record.count > maxRequests) {
    BLOCKED_IPS.add(ip);
    setTimeout(() => BLOCKED_IPS.delete(ip), windowMs * 5);
    return false;
  }
  return true;
}

export function getClientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://doonscholars.com",
  "https://www.doonscholars.com",
];

export function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("origin") || "";
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
  };
}

const PRIVATE_IPS = /^((10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.|127\.|localhost|0\.0\.0\.0|169\.254\.)/i);

export function isPrivateUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return PRIVATE_IPS.test(parsed.hostname);
  } catch {
    return true;
  }
}

const SAFE_FILE_TYPES = new Set([
  "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
  "video/mp4", "video/webm", "video/ogg",
  "application/pdf", "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain", "text/csv",
  "application/zip", "application/x-zip-compressed",
]);

const DANGEROUS_EXTENSIONS = new Set([
  ".exe", ".bat", ".cmd", ".com", ".msi", ".scr", ".pif",
  ".sh", ".bash", ".csh", ".ksh",
  ".ps1", ".psm1", ".psd1",
  ".php", ".phtml", ".php3", ".php4", ".php5",
  ".asp", ".aspx", ".jsp", ".cgi",
  ".js", ".vbs", ".vbe", ".wsh", ".wsf",
  ".dll", ".sys", ".drv", ".ini", ".inf",
]);

export function isFileUploadSafe(filename: string, mimeType: string): { safe: boolean; reason?: string } {
  const ext = "." + filename.split(".").pop()?.toLowerCase();
  if (DANGEROUS_EXTENSIONS.has(ext)) {
    return { safe: false, reason: `File type ${ext} is not allowed` };
  }
  if (!SAFE_FILE_TYPES.has(mimeType)) {
    return { safe: false, reason: `MIME type ${mimeType} is not allowed` };
  }
  if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
    return { safe: false, reason: "Invalid filename" };
  }
  return { safe: true };
}
