import { uploadFileToCloudinary, type CloudinaryUploadResult } from "@/lib/cloudinary";

export type UploadKind = "pdf" | "image";

export type UploadValidationResult = {
  valid: boolean;
  message?: string;
};

export const MAX_UPLOAD_SIZE_BYTES: Record<UploadKind, number> = {
  pdf: 30 * 1024 * 1024,
  image: 10 * 1024 * 1024,
};

const ALLOWED_MIME_TYPES: Record<UploadKind, string[]> = {
  pdf: ["application/pdf"],
  image: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"],
};

export function parseUploadKind(value: string | null | undefined): UploadKind {
  return value === "image" ? "image" : "pdf";
}

export function validateUploadFile(file: File, kind: UploadKind): UploadValidationResult {
  if (!file) {
    return { valid: false, message: "No file found." };
  }

  if (!ALLOWED_MIME_TYPES[kind].includes(file.type)) {
    return {
      valid: false,
      message: kind === "pdf" ? "Only PDF upload is allowed." : "Only image upload is allowed.",
    };
  }

  if (file.size <= 0) {
    return { valid: false, message: "Uploaded file is empty." };
  }

  if (file.size > MAX_UPLOAD_SIZE_BYTES[kind]) {
    const maxInMb = Math.round(MAX_UPLOAD_SIZE_BYTES[kind] / (1024 * 1024));
    return { valid: false, message: `File size exceeds ${maxInMb}MB limit.` };
  }

  return { valid: true };
}

export async function secureUploadToCloudinary(file: File, kind: UploadKind, folder = "python-arena") {
  const validation = validateUploadFile(file, kind);
  if (!validation.valid) {
    throw new Error(validation.message || "File validation failed.");
  }

  const upload = await uploadFileToCloudinary(file, {
    folder: `${folder}/${kind}`,
    resource_type: kind === "image" ? "image" : "raw",
  });

  return {
    url: upload.secure_url,
    publicId: upload.public_id,
    size: upload.bytes,
    resourceType: upload.resource_type,
    mimeType: file.type,
    originalName: file.name,
    format: upload.format,
  };
}

export type SecureUploadResult = Awaited<ReturnType<typeof secureUploadToCloudinary>>;
export type CloudinaryResult = CloudinaryUploadResult;
