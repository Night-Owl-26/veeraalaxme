const sanitizeHtml = require("sanitize-html");

// Strips all HTML/script content from user-supplied free text (titles,
// descriptions, comments, chat messages) before it's persisted, so stored-XSS
// isn't possible even if a client ever renders a field without escaping.
// React already escapes on render, but sanitizing at the write boundary means
// the API is safe for any future consumer (mobile app, admin tool, etc).
function stripHtml(value) {
  if (typeof value !== "string") return value;
  return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} }).trim();
}

function sanitizeFields(fields) {
  return (req, res, next) => {
    for (const f of fields) {
      if (typeof req.body?.[f] === "string") req.body[f] = stripHtml(req.body[f]);
    }
    next();
  };
}

module.exports = { stripHtml, sanitizeFields };
