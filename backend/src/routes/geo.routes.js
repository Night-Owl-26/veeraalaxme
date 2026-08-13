const router = require("express").Router();
const ctrl = require("../controllers/geo.controller");
const { geoLimiter } = require("../middleware/rateLimiters");
const { requireAuth } = require("../middleware/auth");

// Auth-gated even though it's just a geocoding lookup — its only real caller
// is the Post Property location picker, and leaving it open would let
// anyone use this server as a free, unauthenticated proxy in front of
// Nominatim's rate-limited public service.
router.get("/search", requireAuth, geoLimiter, ctrl.search);

module.exports = router;
