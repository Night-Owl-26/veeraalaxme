const router = require("express").Router();
const ctrl = require("../controllers/contact.controller");
const { validateBody } = require("../middleware/validate");
const { sanitizeFields } = require("../middleware/sanitize");
const { contactSchema } = require("../validators/contact.validators");
const { authLimiter } = require("../middleware/rateLimiters");

router.post("/", authLimiter, sanitizeFields(["name", "message"]), validateBody(contactSchema), ctrl.submitContact);

module.exports = router;
