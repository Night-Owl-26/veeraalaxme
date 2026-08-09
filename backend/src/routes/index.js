const router = require("express").Router();

router.use("/auth", require("./auth.routes"));
router.use("/properties", require("./property.routes"));
router.use("/comments", require("./comment.routes"));
router.use("/chat", require("./chat.routes"));
router.use("/notifications", require("./notification.routes"));
router.use("/users", require("./user.routes"));
router.use("/admin", require("./admin.routes"));
router.use("/ai", require("./ai.routes"));
router.use("/payments", require("./payment.routes"));

module.exports = router;
