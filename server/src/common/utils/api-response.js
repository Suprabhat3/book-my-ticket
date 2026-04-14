export function sendSuccess(res, { statusCode = 200, message = "Success", data = null }) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    error: null,
  });
}

export function sendError(res, { statusCode = 500, message = "Something went wrong", error = null }) {
  return res.status(statusCode).json({
    success: false,
    message,
    data: null,
    error,
  });
}
