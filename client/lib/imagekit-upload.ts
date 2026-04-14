import { ApiError } from "@/lib/api";
import { fetchMovieUploadAuth } from "@/lib/admin-api";

type PosterVariant = "vertical" | "horizontal";

type UploadPosterParams = {
  file: File;
  variant: PosterVariant;
  accessToken: string | null;
  movieTitle?: string;
};

type UploadedPosterResult = {
  url: string;
  fileId: string;
};

type ImageKitUploadResponse = {
  url?: string;
  fileId?: string;
  message?: string;
};

function sanitizeSegment(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function uploadMoviePosterToImageKit({
  file,
  variant,
  accessToken,
  movieTitle,
}: UploadPosterParams): Promise<UploadedPosterResult> {
  if (!file.type.startsWith("image/")) {
    throw new ApiError("Please upload a valid image file.");
  }

  const auth = await fetchMovieUploadAuth(accessToken);
  const formData = new FormData();

  const titleSlug = sanitizeSegment(movieTitle || "movie");
  const extension = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
  const fileName = `${titleSlug}-${variant}-${Date.now()}.${extension}`;

  formData.append("file", file);
  formData.append("fileName", fileName);
  formData.append("folder", `/movies/${variant}`);
  formData.append("token", auth.token);
  formData.append("signature", auth.signature);
  formData.append("expire", String(auth.expire));
  formData.append("publicKey", auth.publicKey);
  formData.append("useUniqueFileName", "true");

  const response = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
    method: "POST",
    body: formData,
  });

  let payload: ImageKitUploadResponse;
  try {
    payload = (await response.json()) as ImageKitUploadResponse;
  } catch {
    throw new ApiError("Image upload failed due to invalid upload response.");
  }

  if (!response.ok) {
    throw new ApiError(payload.message || "Image upload failed.");
  }

  if (!payload.url || !payload.fileId) {
    throw new ApiError("Image upload succeeded but response is missing URL or fileId.");
  }

  return {
    url: payload.url,
    fileId: payload.fileId,
  };
}
