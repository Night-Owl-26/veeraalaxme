const router = require("express").Router();
const ctrl = require("../controllers/notification.controller");
const { requireAuth } = require("../middleware/auth");

router.get("/", requireAuth, ctrl.listNotifications);
router.patch("/:id/read", requireAuth, ctrl.markRead);
router.patch("/read-all", requireAuth, ctrl.markAllRead);

module.exports = router;
