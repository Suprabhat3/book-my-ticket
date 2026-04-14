import { sendError } from "../utils/api-response.js";

export function notFoundMiddleware(req, res) {
  return sendError(res, {
    statusCode: 404,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    error: "NOT_FOUND",
  });
}
