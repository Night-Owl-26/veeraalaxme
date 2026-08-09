const crypto = require("crypto");

// Double-submit-cookie CSRF protection for the cookie-authenticated refresh flow.
// The access token travels in an Authorization header (immune to CSRF by design,
// since browsers don't auto-attach it), but the httpOnly refresh-token cookie
// does need this: on login we set a readable csrf_token cookie, the frontend
// echoes it back as a header on state-changing requests, and we compare the two.
function issueCsrfCookie(res) {
  const token = crypto.randomBytes(24).toString("hex");
  res.cookie("csrf_token", token, {
    httpOnly: false,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
  return token;
}

function verifyCsrf(req, res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  // Only enforced on routes that rely on the cookie (refresh/logout). Routes
  // authenticated purely via Authorization header don't need this check, but
  // it's harmless to apply broadly since we always issue the cookie on login.
  const header = req.headers["x-csrf-token"];
  const cookie = req.cookies?.csrf_token;
  if (!header || !cookie || header !== cookie) {
    return res.status(403).json({ success: false, error: { message: "CSRF token missing or invalid" } });
  }
  next();
}

module.exports = { issueCsrfCookie, verifyCsrf };
