const router = require("express").Router();
const ctrl = require("../controllers/payment.controller");
const { requireAuth } = require("../middleware/auth");
const { requireRole } = require("../middleware/rbac");

router.post("/create-order", requireAuth, requireRole(["SELLER", "ADMIN"]), ctrl.createOrder);
router.post("/verify", requireAuth, ctrl.verifyPayment);

module.exports = router;
