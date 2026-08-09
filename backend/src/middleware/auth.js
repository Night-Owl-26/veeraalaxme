const { verifyAccessToken } = require("../utils/jwt");
const { fail } = require("../utils/apiResponse");
const prisma = require("../config/db");

// Requires a valid access token. Attaches req.user = { id, role, phone }.
async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return fail(res, 401, "Authentication required");

  try {
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) return fail(res, 401, "User no longer exists");
    if (user.isBlacklisted) return fail(res, 403, "This account has been suspended");
    req.user = { id: user.id, role: user.role, phone: user.phone, name: user.name };
    next();
  } catch (e) {
    return fail(res, 401, "Invalid or expired token");
  }
}

// Like requireAuth, but doesn't fail if there's no token — useful for routes
// (e.g. property listing) that behave slightly differently for logged-in users
// but are still public.
async function optionalAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return next();
  try {
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (user && !user.isBlacklisted) req.user = { id: user.id, role: user.role, phone: user.phone, name: user.name };
  } catch (e) {
    // ignore invalid token on optional routes
  }
  next();
}

module.exports = { requireAuth, optionalAuth };
