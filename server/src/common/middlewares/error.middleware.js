import { sendError } from "../utils/api-response.js";

export function errorMiddleware(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  return sendError(res, {
    statusCode,
    message,
    error: process.env.NODE_ENV === "production" ? null : err.details || err.stack,
  });
}
