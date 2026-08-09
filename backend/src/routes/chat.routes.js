const router = require("express").Router();
const ctrl = require("../controllers/chat.controller");
const { requireAuth } = require("../middleware/auth");
const { validateBody } = require("../middleware/validate");
const { sanitizeFields } = require("../middleware/sanitize");
const { startThreadSchema, sendMessageSchema } = require("../validators/chat.validators");

router.get("/threads", requireAuth, ctrl.listThreads);
router.post("/threads", requireAuth, validateBody(startThreadSchema), ctrl.startThread);
router.get("/threads/:id/messages", requireAuth, ctrl.getMessages);
router.post("/threads/:id/messages", requireAuth, sanitizeFields(["text"]), validateBody(sendMessageSchema), ctrl.sendMessage);

module.exports = router;
