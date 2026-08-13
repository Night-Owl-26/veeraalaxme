const router = require("express").Router();
const ctrl = require("../controllers/admin.controller");
const reportCtrl = require("../controllers/report.controller");
const { requireAuth } = require("../middleware/auth");
const { requireRole } = require("../middleware/rbac");
const { validateBody } = require("../middleware/validate");
const { resolveReportSchema } = require("../validators/property.validators");

router.use(requireAuth, requireRole("ADMIN"));

router.get("/properties/recent", ctrl.listRecentProperties);
router.patch("/properties/:id/approve", ctrl.approveProperty);
router.patch("/properties/:id/reject", ctrl.rejectProperty);
router.patch("/properties/:id/verify-documents", ctrl.verifyDocuments);

router.get("/users", ctrl.listUsers);
router.patch("/users/:id/blacklist", ctrl.setBlacklist);
router.patch("/users/:id/verify-seller", ctrl.verifySeller);

router.get("/analytics", ctrl.analytics);
router.get("/audit-logs", ctrl.listAuditLogs);

router.get("/reports", reportCtrl.listReports);
router.patch("/reports/:id", validateBody(resolveReportSchema), reportCtrl.resolveReport);

module.exports = router;
