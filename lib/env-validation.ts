const requiredEnvVars = [
  "MONGODB_URI",
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
] as const;

const optionalEnvVars = [
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "GOOGLE_API_KEY",
  "REDIS_URL",
  "AI_BACKEND_URL",
] as const;

type EnvVar = (typeof requiredEnvVars)[number];

function getMissingEnvVars(): EnvVar[] {
  const missing: EnvVar[] = [];
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }
  return missing;
}

export function validateEnv(): { valid: boolean; missing: string[]; warnings: string[] } {
  const missing = getMissingEnvVars();
  const warnings: string[] = [];

  for (const envVar of optionalEnvVars) {
    if (!process.env[envVar]) {
      warnings.push(`Optional env var not set: ${envVar}`);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}

export function getEnvStatus() {
  const allVars = [...requiredEnvVars, ...optionalEnvVars];
  const status: Record<string, boolean> = {};

  for (const envVar of allVars) {
    status[envVar] = !!process.env[envVar];
  }

  return status;
}

// Run validation on import (server-side only)
if (typeof window === "undefined") {
  const result = validateEnv();
  if (!result.valid) {
    console.error("❌ Missing required environment variables:", result.missing);
    console.error("Please add them to your .env.local file");
  }
  if (result.warnings.length > 0) {
    console.warn("⚠️ Environment variable warnings:");
    result.warnings.forEach((w) => console.warn("  ", w));
  }
}
