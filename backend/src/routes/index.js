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
router.use("/vastu", require("./vastu.routes"));
router.use("/geo", require("./geo.routes"));
router.use("/contact", require("./contact.routes"));

module.exports = router;
