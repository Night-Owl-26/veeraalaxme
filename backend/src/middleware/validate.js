const { fail } = require("../utils/apiResponse");

// Validates req.body (or req.query) against a zod schema and replaces it with
// the parsed, type-coerced result — so downstream code never touches raw
// unvalidated input. This is the app's primary defense against malformed or
// malicious payloads, alongside Prisma's parameterized queries.
function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return fail(res, 422, "Validation failed", result.error.flatten());
    }
    req.body = result.data;
    next();
  };
}

function validateQuery(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return fail(res, 422, "Invalid query parameters", result.error.flatten());
    }
    req.query = result.data;
    next();
  };
}

module.exports = { validateBody, validateQuery };
