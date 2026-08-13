const prisma = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const { ok, fail } = require("../utils/apiResponse");
const { notify } = require("../services/notificationService");
const { recordAudit } = require("../services/auditService");
const { serializeProperty, PROPERTY_INCLUDE } = require("./property.controller");

// GET /api/admin/properties/recent
// Sellers publish directly (no approval gate), so this surfaces newly posted
// listings for after-the-fact review/moderation instead of a pending queue.
const listRecentProperties = asyncHandler(async (req, res) => {
  const items = await prisma.property.findMany({
    include: PROPERTY_INCLUDE,
    orderBy: { createdAt: "desc" },
    take: 20,
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
    userId: property.sellerId, type: "APPROVAL", message: `Your listing "${property.title}" was approved and is now live`, link: `/property/${property.slug}`,
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
    userId: property.sellerId, type: "REJECTION", message: `Your listing "${property.title}" was rejected: ${reason}`, link: `/property/${property.slug}`,
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

// GET /api/admin/users — full contact directory for admin moderation.
// Phone/email are ordinarily masked from other users; admins are the one
// role that legitimately needs them (support, fraud investigation, verifying
// a seller's identity before granting the "verified" badge).
const listUsers = asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, name: true, phone: true, email: true, role: true,
      emailVerified: true, phoneVerified: true, isVerifiedSeller: true, isBlacklisted: true,
      createdAt: true,
      _count: { select: { properties: true } },
    },
  });
  return ok(res, {
    items: users.map((u) => ({
      id: u.id, name: u.name, phone: u.phone, email: u.email, role: u.role,
      emailVerified: u.emailVerified, phoneVerified: u.phoneVerified,
      isVerifiedSeller: u.isVerifiedSeller, isBlacklisted: u.isBlacklisted,
      createdAt: u.createdAt, listingsCount: u._count.properties,
    })),
  });
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
  const [totalListings, newListings7d, approved, rejected, totalUsers, buyers, sellers, verifiedSellers, byType, recentPayments] =
    await Promise.all([
      prisma.property.count(),
      prisma.property.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
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
    totalListings, newListings7d, approved, rejected,
    totalUsers, buyers, sellers, verifiedSellers,
    byType: byType.map((t) => ({ type: t.type, count: t._count.type })),
    revenueLast30Days: recentPayments._sum.amount || 0,
  });
});

module.exports = { listRecentProperties, approveProperty, rejectProperty, verifyDocuments, listUsers, setBlacklist, verifySeller, analytics, listAuditLogs };
