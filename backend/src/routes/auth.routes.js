const router = require("express").Router();
const ctrl = require("../controllers/auth.controller");
const { validateBody } = require("../middleware/validate");
const { requestOtpSchema, verifyOtpSchema } = require("../validators/auth.validators");
const { authLimiter } = require("../middleware/rateLimiters");
const { verifyCsrf } = require("../middleware/csrf");
const { requireAuth } = require("../middleware/auth");

router.post("/otp/request", authLimiter, validateBody(requestOtpSchema), ctrl.requestOtp);
router.post("/otp/verify", authLimiter, validateBody(verifyOtpSchema), ctrl.verifyOtpAndAuth);
router.post("/refresh", verifyCsrf, ctrl.refresh);
router.post("/logout", verifyCsrf, ctrl.logout);
router.get("/me", requireAuth, ctrl.me);

module.exports = router;
