const { ApiError } = require("../utils/apiResponse");

function notFoundHandler(req, res) {
  res.status(404).json({ success: false, error: { message: "Route not found" } });
}

// Centralized error handler. Never leaks stack traces or internal messages
// to the client in production — logs them server-side instead.
function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ success: false, error: { message: err.message, details: err.details } });
  }

  console.error("[unhandled error]", err);

  if (err.code === "P2002") {
    // Prisma unique constraint violation
    return res.status(409).json({ success: false, error: { message: "That record already exists" } });
  }
  if (err.code === "P2025") {
    return res.status(404).json({ success: false, error: { message: "Record not found" } });
  }

  const status = err.status || 500;
  const message = process.env.NODE_ENV === "production" ? "Something went wrong" : err.message;
  res.status(status).json({ success: false, error: { message } });
}

module.exports = { notFoundHandler, errorHandler };
