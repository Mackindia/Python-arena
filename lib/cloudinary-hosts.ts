const CLOUDINARY_HOST_PATTERNS = [
  /^res\.cloudinary\.com$/i,
  /^res-[1-5]\.cloudinary\.com$/i,
  /^[a-z0-9-]+-res\.cloudinary\.com$/i,
];

export function isAllowedCloudinaryHost(hostname: string) {
  return CLOUDINARY_HOST_PATTERNS.some((pattern) => pattern.test(hostname));
}

export function isAllowedCloudinaryUrl(rawUrl: string) {
  try {
    const parsed = new URL(rawUrl);
    return ["http:", "https:"].includes(parsed.protocol) && isAllowedCloudinaryHost(parsed.hostname);
  } catch {
    return false;
  }
}