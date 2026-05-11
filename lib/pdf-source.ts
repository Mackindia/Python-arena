export function isValidHttpUrl(rawUrl: string) {
  try {
    const parsed = new URL(rawUrl);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

export function looksLikePdfUrl(rawUrl: string) {
  try {
    const parsed = new URL(rawUrl);
    return parsed.pathname.toLowerCase().endsWith(".pdf");
  } catch {
    return false;
  }
}