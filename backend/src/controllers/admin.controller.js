const prisma = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const { ok, fail } = require("../utils/apiResponse");
const { notify } = require("../services/notificationService");
const { recordAudit } = require("../services/auditService");
const { serializeProperty, PROPERTY_INCLUDE } = require("./property.controller");

// GET /api/admin/properties/pending
const listPending = asyncHandler(async (req, res) => {
  const items = await prisma.property.findMany({
    where: { status: "PENDING" },
    include: PROPERTY_INCLUDE,
    orderBy: { createdAt: "asc" },
  });
  return ok(res, { items: items.map((p) => serializeProperty(p, { includeSurveyNumber: true })) });
});

// PATCH /api/admin/properties/:id/approve
const approveProperty = asyncHandler(async (req, res) => {
  const property = await prisma.property.update({
    where: { id: req.params.id },
    data: { status: "APPROVED", rejectionReason: null },
  });
  await recordAudit({ actorId: req.user.id, action: "property.approve", targetType: "Property", targetId: property.id });
  await notify(req.app.get("io"), {
    userId: property.sellerId, type: "APPROVAL", message: `Your listing "${property.title}" was approved and is now live`, link: `/property/${property.id}`,
  });
  return ok(res, { property });
});

// PATCH /api/admin/properties/:id/reject
const rejectProperty = asyncHandler(async (req, res) => {
  const reason = req.body.reason || "Did not meet listing guidelines";
  const property = await prisma.property.update({
    where: { id: req.params.id },
    data: { status: "REJECTED", rejectionReason: reason },
  });
  await recordAudit({ actorId: req.user.id, action: "property.reject", targetType: "Property", targetId: property.id, metadata: { reason } });
  await notify(req.app.get("io"), {
    userId: property.sellerId, type: "REJECTION", message: `Your listing "${property.title}" was rejected: ${reason}`, link: `/property/${property.id}`,
  });
  return ok(res, { property });
});

// PATCH /api/admin/properties/:id/verify-documents
const verifyDocuments = asyncHandler(async (req, res) => {
  const property = await prisma.property.update({
    where: { id: req.params.id },
    data: { documentsVerified: true },
  });
  await recordAudit({ actorId: req.user.id, action: "property.verify_documents", targetType: "Property", targetId: property.id });
  return ok(res, { property });
});

// PATCH /api/admin/users/:id/blacklist
const setBlacklist = asyncHandler(async (req, res) => {
  const blacklisted = !!req.body.blacklisted;
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { isBlacklisted: blacklisted },
  });
  await recordAudit({ actorId: req.user.id, action: blacklisted ? "user.blacklist" : "user.unblacklist", targetType: "User", targetId: user.id });
  return ok(res, { user: { id: user.id, name: user.name, isBlacklisted: user.isBlacklisted } });
});

// PATCH /api/admin/users/:id/verify-seller
const verifySeller = asyncHandler(async (req, res) => {
  const verified = !!req.body.verified;
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { isVerifiedSeller: verified },
  });
  await recordAudit({ actorId: req.user.id, action: verified ? "user.verify_seller" : "user.unverify_seller", targetType: "User", targetId: user.id });
  return ok(res, { user: { id: user.id, name: user.name, isVerifiedSeller: user.isVerifiedSeller } });
});

// GET /api/admin/audit-logs
const listAuditLogs = asyncHandler(async (req, res) => {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { actor: { select: { id: true, name: true, role: true } } },
  });
  return ok(res, { items: logs });
});

// GET /api/admin/analytics
const analytics = asyncHandler(async (req, res) => {
  const [totalListings, pending, approved, rejected, totalUsers, buyers, sellers, verifiedSellers, byType, recentPayments] =
    await Promise.all([
      prisma.property.count(),
      prisma.property.count({ where: { status: "PENDING" } }),
      prisma.property.count({ where: { status: "APPROVED" } }),
      prisma.property.count({ where: { status: "REJECTED" } }),
      prisma.user.count(),
      prisma.user.count({ where: { role: "BUYER" } }),
      prisma.user.count({ where: { role: "SELLER" } }),
      prisma.user.count({ where: { isVerifiedSeller: true } }),
      prisma.property.groupBy({ by: ["type"], where: { status: "APPROVED" }, _count: { type: true } }),
      prisma.payment.aggregate({ where: { status: "PAID", createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }, _sum: { amount: true } }),
    ]);

  return ok(res, {
    totalListings, pending, approved, rejected,
    totalUsers, buyers, sellers, verifiedSellers,
    byType: byType.map((t) => ({ type: t.type, count: t._count.type })),
    revenueLast30Days: recentPayments._sum.amount || 0,
  });
});

module.exports = { listPending, approveProperty, rejectProperty, verifyDocuments, setBlacklist, verifySeller, analytics, listAuditLogs };
