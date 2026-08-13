const router = require("express").Router();
const ctrl = require("../controllers/property.controller");
const commentCtrl = require("../controllers/comment.controller");
const reportCtrl = require("../controllers/report.controller");
const { requireAuth, optionalAuth } = require("../middleware/auth");
const { requireRole, requireOwnerOrAdmin } = require("../middleware/rbac");
const { validateBody, validateQuery } = require("../middleware/validate");
const { sanitizeFields } = require("../middleware/sanitize");
const { createPropertySchema, updatePropertySchema, searchQuerySchema, commentSchema, reportSchema } = require("../validators/property.validators");
const { imageUpload, docUpload } = require("../middleware/upload");
const { postPropertyLimiter } = require("../middleware/rateLimiters");

const loadPropertyOwner = async (req) => {
  const p = await ctrl.resolvePropertyIdOrSlug(req.params.id);
  return p?.sellerId || null;
};

router.get("/", optionalAuth, validateQuery(searchQuerySchema), ctrl.listProperties);
router.get("/mine", requireAuth, requireRole(["SELLER", "ADMIN"]), ctrl.listMyProperties);
router.get("/saved", requireAuth, ctrl.listSaved);
router.get("/:id", optionalAuth, ctrl.getProperty);

router.post(
  "/",
  requireAuth, requireRole(["SELLER", "ADMIN"]), postPropertyLimiter,
  sanitizeFields(["title", "description", "locality", "city", "road", "ownership"]),
  validateBody(createPropertySchema),
  ctrl.createProperty
);

router.patch(
  "/:id",
  requireAuth, requireOwnerOrAdmin(loadPropertyOwner),
  sanitizeFields(["title", "description", "locality", "city", "road", "ownership"]),
  validateBody(updatePropertySchema),
  ctrl.updateProperty
);

router.delete("/:id", requireAuth, requireOwnerOrAdmin(loadPropertyOwner), ctrl.deleteProperty);

router.post("/:id/images", requireAuth, requireOwnerOrAdmin(loadPropertyOwner), imageUpload.array("images", 20), ctrl.uploadImages);
router.post("/:id/documents", requireAuth, requireOwnerOrAdmin(loadPropertyOwner), docUpload.array("documents", 5), ctrl.uploadDocuments);

router.post("/:id/like", requireAuth, ctrl.toggleLike);
router.post("/:id/save", requireAuth, ctrl.toggleSave);

router.post("/:id/comments", requireAuth, sanitizeFields(["text"]), validateBody(commentSchema), commentCtrl.addComment);
router.post("/:id/report", requireAuth, validateBody(reportSchema), reportCtrl.fileReport);

module.exports = router;
