import crypto from "crypto";
import { env } from "../../config/env.js";
import { AppError } from "./app-error.js";

export function createImageKitUploadAuthParams() {
  if (!env.imagekitPublicKey || !env.imagekitPrivateKey || !env.imagekitUrlEndpoint) {
    throw new AppError("ImageKit is not configured on server", 500);
  }

  const token = crypto.randomBytes(16).toString("hex");
  const expire = Math.floor(Date.now() / 1000) + 5 * 60;
  const signature = crypto
    .createHmac("sha1", env.imagekitPrivateKey)
    .update(`${token}${expire}`)
    .digest("hex");

  return {
    token,
    expire,
    signature,
    publicKey: env.imagekitPublicKey,
    urlEndpoint: env.imagekitUrlEndpoint,
  };
}