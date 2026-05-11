import { v2 as cloudinary } from "cloudinary";

type CloudinaryResourceType = "image" | "raw" | "video";

type UploadBufferOptions = {
  folder?: string;
  resource_type?: CloudinaryResourceType;
  public_id?: string;
};

export type CloudinaryUploadResult = {
  secure_url: string;
  public_id: string;
  bytes: number;
  resource_type: string;
  format?: string;
};

export type CloudinaryDestroyResult = {
  result: string;
};

const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

if (cloudName && apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
}

function ensureCloudinaryConfig() {
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary env vars missing: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET");
  }
}

export async function uploadBufferToCloudinary(buffer: Buffer, options: UploadBufferOptions) {
  ensureCloudinaryConfig();

  return new Promise<CloudinaryUploadResult>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) {
        reject(error);
      } else if (!result) {
        reject(new Error("Cloudinary returned an empty upload result."));
      } else {
        resolve(result as CloudinaryUploadResult);
      }
    });

    stream.end(buffer);
  });
}

export async function uploadFileToCloudinary(file: File, options: UploadBufferOptions) {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  return uploadBufferToCloudinary(buffer, options);
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function extractCloudinaryPath(url: string) {
  try {
    const parsed = new URL(url);
    const marker = "/upload/";
    const markerIndex = parsed.pathname.indexOf(marker);

    if (markerIndex === -1) {
      return "";
    }

    return decodeURIComponent(parsed.pathname.slice(markerIndex + marker.length));
  } catch {
    return "";
  }
}

function removeVersionSegment(pathAfterUpload: string) {
  return pathAfterUpload.replace(/^v\d+\//, "");
}

function stripExtension(pathValue: string) {
  return pathValue.replace(/\.[a-z0-9]+$/i, "");
}

function buildCandidatePublicIds(url: string) {
  const cleanedPath = removeVersionSegment(extractCloudinaryPath(url));
  if (!cleanedPath) {
    return [];
  }

  return uniqueValues([cleanedPath, stripExtension(cleanedPath)]);
}

export async function destroyCloudinaryResource(publicId: string, resourceType: CloudinaryResourceType) {
  ensureCloudinaryConfig();
  return (await cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
    invalidate: true,
  })) as CloudinaryDestroyResult;
}

export type DeleteCloudinaryAssetResult = {
  ok: boolean;
  deleted: boolean;
  attempts: Array<{
    publicId: string;
    resourceType: CloudinaryResourceType;
    result: string;
  }>;
  error?: string;
};

export async function deleteCloudinaryAssetByUrl(
  url: string,
  resourceTypeHints: CloudinaryResourceType[] = ["raw", "image"],
): Promise<DeleteCloudinaryAssetResult> {
  const publicIds = buildCandidatePublicIds(url);

  if (!publicIds.length) {
    return {
      ok: false,
      deleted: false,
      attempts: [],
      error: "Could not derive Cloudinary public_id from URL",
    };
  }

  const resourceTypes = uniqueValues(resourceTypeHints) as CloudinaryResourceType[];
  const attempts: DeleteCloudinaryAssetResult["attempts"] = [];
  let lastError = "";

  for (const resourceType of resourceTypes) {
    for (const publicId of publicIds) {
      try {
        const response = await destroyCloudinaryResource(publicId, resourceType);
        attempts.push({ publicId, resourceType, result: response.result });

        if (response.result === "ok") {
          return { ok: true, deleted: true, attempts };
        }

        if (response.result === "not found") {
          continue;
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : "Cloudinary delete failed";
      }
    }
  }

  const onlyNotFound = attempts.length > 0 && attempts.every((attempt) => attempt.result === "not found");

  if (onlyNotFound) {
    return {
      ok: true,
      deleted: false,
      attempts,
    };
  }

  return {
    ok: false,
    deleted: false,
    attempts,
    error: lastError || "Cloudinary delete failed",
  };
}
