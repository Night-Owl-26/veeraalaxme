const router = require("express").Router();
const ctrl = require("../controllers/auth.controller");
const { validateBody } = require("../middleware/validate");
const {
  registerRequestOtpSchema, registerVerifyOtpSchema, loginSchema,
  forgotPasswordSchema, resetPasswordSchema,
} = require("../validators/auth.validators");
const { authLimiter } = require("../middleware/rateLimiters");
const { verifyCsrf } = require("../middleware/csrf");
const { requireAuth } = require("../middleware/auth");

router.post("/register/request-otp", authLimiter, validateBody(registerRequestOtpSchema), ctrl.requestRegisterOtp);
router.post("/register/verify-otp", authLimiter, validateBody(registerVerifyOtpSchema), ctrl.verifyRegisterOtp);
router.post("/login", authLimiter, validateBody(loginSchema), ctrl.login);
router.post("/password/forgot", authLimiter, validateBody(forgotPasswordSchema), ctrl.forgotPassword);
router.post("/password/reset", authLimiter, validateBody(resetPasswordSchema), ctrl.resetPassword);
router.post("/refresh", verifyCsrf, ctrl.refresh);
router.post("/logout", verifyCsrf, ctrl.logout);
router.get("/me", requireAuth, ctrl.me);

module.exports = router;
