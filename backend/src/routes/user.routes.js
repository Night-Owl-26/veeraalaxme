const router = require("express").Router();
const ctrl = require("../controllers/user.controller");
const { requireAuth } = require("../middleware/auth");

router.patch("/me", requireAuth, ctrl.updateMe);
router.get("/me/seller-stats", requireAuth, ctrl.sellerStats);

module.exports = router;
