const router = require("express").Router();
const ctrl = require("../controllers/vastu.controller");
const { requireAuth, optionalAuth } = require("../middleware/auth");
const { validateBody } = require("../middleware/validate");
const { landVastuSchema, homeVastuSchema } = require("../validators/vastu.validators");
const { aiLimiter } = require("../middleware/rateLimiters");

router.post("/land/analyze", optionalAuth, validateBody(landVastuSchema), ctrl.analyzeLand);
router.post("/home/analyze", optionalAuth, validateBody(homeVastuSchema), ctrl.analyzeHome);

router.get("/analyses", requireAuth, ctrl.listMyAnalyses);
router.get("/analyses/:id", optionalAuth, ctrl.getAnalysis);
router.post("/analyses/:id/explain", optionalAuth, aiLimiter, ctrl.explainAnalysis);

module.exports = router;
