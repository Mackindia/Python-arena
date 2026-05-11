export type AdminUploadKind = "pdf" | "image";

export type AdminUploadedAsset = {
  url: string;
  publicId: string;
  size: number;
  resourceType: string;
  mimeType: string;
  originalName: string;
  format?: string;
};

type UploadAdminFileInput = {
  file: File;
  kind: AdminUploadKind;
  folder?: string;
  onProgress?: (progress: number) => void;
};

type UploadApiResponse = {
  message?: string;
  upload?: AdminUploadedAsset;
  error?: string;
};

export function uploadAdminFile({
  file,
  kind,
  folder = "python-arena",
  onProgress,
}: UploadAdminFileInput) {
  return new Promise<AdminUploadedAsset>((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);
    formData.append("kind", kind);

    const request = new XMLHttpRequest();
    request.open("POST", "/api/admin/upload");

    request.upload.onprogress = (event) => {
      if (!onProgress || !event.lengthComputable) {
        return;
      }

      const nextProgress = Math.round((event.loaded / event.total) * 100);
      onProgress(Math.max(0, Math.min(100, nextProgress)));
    };

    request.onerror = () => {
      reject(new Error("Upload request failed. Please check your connection."));
    };

    request.onload = () => {
      let data: UploadApiResponse = {};

      try {
        data = JSON.parse(request.responseText) as UploadApiResponse;
      } catch {
        reject(new Error("Invalid upload response from server."));
        return;
      }

      if (request.status < 200 || request.status >= 300 || !data.upload) {
        reject(new Error(data.message || data.error || "Upload failed."));
        return;
      }

      onProgress?.(100);
      resolve(data.upload);
    };

    request.send(formData);
  });
}
