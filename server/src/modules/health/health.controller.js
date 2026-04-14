import { sendSuccess } from "../../common/utils/api-response.js";

export function healthCheck(req, res) {
  return sendSuccess(res, {
    message: "Server is healthy",
    data: {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  });
}
