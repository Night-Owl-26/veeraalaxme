const prisma = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const { ok, fail } = require("../utils/apiResponse");
const { recordAudit } = require("../services/auditService");
const { resolvePropertyIdOrSlug } = require("./property.controller");

// POST /api/properties/:id/report
const fileReport = asyncHandler(async (req, res) => {
  const property = await resolvePropertyIdOrSlug(req.params.id);
  if (!property) return fail(res, 404, "Listing not found");
  const propertyId = property.id;

  const report = await prisma.report.create({
    data: { propertyId, reporterId: req.user.id, reason: req.body.reason, details: req.body.details },
  });

  // Three or more open reports auto-hides a listing pending admin review —
  // a lightweight community-moderation backstop.
  const openReports = await prisma.report.count({ where: { propertyId, status: "OPEN" } });
  if (openReports >= 3 && property.status === "APPROVED") {
    await prisma.property.update({ where: { id: propertyId }, data: { status: "PENDING" } });
  }

  return ok(res, { report }, 201);
});

// GET /api/admin/reports — admin only
const listReports = asyncHandler(async (req, res) => {
  const reports = await prisma.report.findMany({
    where: { status: "OPEN" },
    include: { property: true, reporter: true },
    orderBy: { createdAt: "desc" },
  });
  return ok(res, { items: reports });
});

// PATCH /api/admin/reports/:id — admin only, resolve
const resolveReport = asyncHandler(async (req, res) => {
  const status = req.body.status || "REVIEWED";
  const report = await prisma.report.update({
    where: { id: req.params.id },
    data: { status },
  });
  await recordAudit({ actorId: req.user.id, action: "report.resolve", targetType: "Report", targetId: report.id, metadata: { status } });
  return ok(res, { report });
});

module.exports = { fileReport, listReports, resolveReport };
