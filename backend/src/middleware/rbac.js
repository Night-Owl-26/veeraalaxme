const { fail } = require("../utils/apiResponse");

// Role-based access control. Usage: requireRole("ADMIN") or requireRole(["SELLER","ADMIN"]).
// Must run after requireAuth.
function requireRole(roles) {
  const allowed = Array.isArray(roles) ? roles : [roles];
  return (req, res, next) => {
    if (!req.user) return fail(res, 401, "Authentication required");
    if (!allowed.includes(req.user.role)) return fail(res, 403, "You don't have permission to do that");
    next();
  };
}

// Object-level authorization: only the resource owner or an admin may proceed.
// `loadOwnerId` is an async function (req) => ownerId | null.
function requireOwnerOrAdmin(loadOwnerId) {
  return async (req, res, next) => {
    if (!req.user) return fail(res, 401, "Authentication required");
    if (req.user.role === "ADMIN") return next();
    try {
      const ownerId = await loadOwnerId(req);
      if (ownerId && ownerId === req.user.id) return next();
      return fail(res, 403, "You don't have permission to modify this resource");
    } catch (e) {
      return next(e);
    }
  };
}

module.exports = { requireRole, requireOwnerOrAdmin };
