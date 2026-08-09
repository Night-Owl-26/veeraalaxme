// Wraps async route handlers so thrown errors reach errorHandler.js
// instead of crashing the process or hanging the request.
module.exports = function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
};
