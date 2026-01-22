import { v2 as cloudinary } from "cloudinary";

type CloudinaryUploadResult = {
  secure_url: string;
  public_id: string;
};

function ensureCloudinaryConfigured() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Missing Cloudinary env vars: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET"
    );
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

function randomId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function uploadImageFile(
  file: File,
  options?: { folder?: string; publicIdPrefix?: string }
): Promise<CloudinaryUploadResult> {
  ensureCloudinaryConfigured();

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const folder = options?.folder;
  const publicIdPrefix = options?.publicIdPrefix;
  const public_id = publicIdPrefix ? `${publicIdPrefix}-${randomId()}` : undefined;

  return await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "image",
        folder,
        public_id,
        overwrite: false,
      },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error("Upload failed"));
        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
        });
      }
    );

    stream.end(buffer);
  });
}

export function extractCloudinaryPublicIdFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "res.cloudinary.com") return null;

    // Typical format:
    // /<cloud_name>/image/upload/v<version>/<public_id>.<ext>
    const parts = parsed.pathname.split("/").filter(Boolean);
    const uploadIndex = parts.findIndex((p) => p === "upload");
    if (uploadIndex < 0) return null;

    const afterUpload = parts.slice(uploadIndex + 1);
    if (afterUpload.length === 0) return null;

    // Skip version segment if present
    const pathWithoutVersion =
      afterUpload[0].startsWith("v") && /^v\d+$/.test(afterUpload[0])
        ? afterUpload.slice(1)
        : afterUpload;

    if (pathWithoutVersion.length === 0) return null;

    const joined = pathWithoutVersion.join("/");
    // remove extension
    const lastDot = joined.lastIndexOf(".");
    return lastDot > -1 ? joined.slice(0, lastDot) : joined;
  } catch {
    return null;
  }
}

export async function deleteCloudinaryByPublicId(publicId: string) {
  ensureCloudinaryConfigured();
  // Returns { result: 'ok' | 'not found' }
  return cloudinary.uploader.destroy(publicId, { resource_type: "image" });
}

export async function deleteCloudinaryByUrl(url: string) {
  const publicId = extractCloudinaryPublicIdFromUrl(url);
  if (!publicId) return { result: "skipped" } as const;
  await deleteCloudinaryByPublicId(publicId);
  return { result: "ok" } as const;
}
