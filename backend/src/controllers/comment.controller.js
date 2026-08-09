const prisma = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const { ok, fail } = require("../utils/apiResponse");
const { notify } = require("../services/notificationService");

// POST /api/properties/:id/comments
const addComment = asyncHandler(async (req, res) => {
  const propertyId = req.params.id;
  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property || property.status !== "APPROVED") return fail(res, 404, "Listing not found");

  const comment = await prisma.comment.create({
    data: { propertyId, userId: req.user.id, text: req.body.text },
    include: { user: true },
  });

  if (property.sellerId !== req.user.id) {
    await notify(req.app.get("io"), {
      userId: property.sellerId, type: "COMMENT", message: `${req.user.name} commented on "${property.title}"`, link: `/property/${propertyId}`,
    });
  }

  return ok(res, { comment: { id: comment.id, text: comment.text, createdAt: comment.createdAt, user: { id: comment.user.id, name: comment.user.name } } }, 201);
});

// DELETE /api/comments/:id — author or admin
const deleteComment = asyncHandler(async (req, res) => {
  const comment = await prisma.comment.findUnique({ where: { id: req.params.id } });
  if (!comment) return fail(res, 404, "Comment not found");
  if (comment.userId !== req.user.id && req.user.role !== "ADMIN") return fail(res, 403, "Not your comment");
  await prisma.comment.delete({ where: { id: comment.id } });
  return ok(res, { deleted: true });
});

module.exports = { addComment, deleteComment };
