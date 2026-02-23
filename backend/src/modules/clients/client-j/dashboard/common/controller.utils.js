export function sendSuccess(res, data, statusCode = 200) {
  return res.status(statusCode).json({ success: true, data });
}

export function handleControllerError(res, error, message = "Request failed") {
  console.error(message, error);
  return res.status(500).json({
    success: false,
    message,
    error: error?.message || "Unexpected error",
  });
}

