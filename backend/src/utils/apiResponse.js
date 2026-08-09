class ApiError extends Error {
  constructor(status, message, details = null) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

function ok(res, data, status = 200) {
  return res.status(status).json({ success: true, data });
}

function fail(res, status, message, details = null) {
  return res.status(status).json({ success: false, error: { message, details } });
}

module.exports = { ApiError, ok, fail };
