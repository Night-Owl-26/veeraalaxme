const router = require("express").Router();
const ctrl = require("../controllers/ai.controller");
const { requireAuth } = require("../middleware/auth");
const { requireRole } = require("../middleware/rbac");
const { aiLimiter } = require("../middleware/rateLimiters");

// AI generation is gated behind auth + rate limiting since each call costs
// real tokens and could otherwise be used to drain the server's API budget.
router.post("/property-description", requireAuth, requireRole(["SELLER", "ADMIN"]), aiLimiter, ctrl.propertyDescription);
router.post("/vastu-insight", requireAuth, aiLimiter, ctrl.vastuInsight);

module.exports = router;
