const prisma = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const { ok, fail } = require("../utils/apiResponse");

// PATCH /api/users/me
const updateMe = asyncHandler(async (req, res) => {
  const { name, avatarUrl } = req.body;
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { name: name || undefined, avatarUrl: avatarUrl || undefined },
  });
  return ok(res, { user: { id: user.id, name: user.name, avatarUrl: user.avatarUrl } });
});

// GET /api/users/me/seller-stats — seller dashboard summary
const sellerStats = asyncHandler(async (req, res) => {
  if (req.user.role !== "SELLER" && req.user.role !== "ADMIN") return fail(res, 403, "Sellers only");

  const [total, approved, pending, rejected, totalLikes, totalViews, totalComments] = await Promise.all([
    prisma.property.count({ where: { sellerId: req.user.id } }),
    prisma.property.count({ where: { sellerId: req.user.id, status: "APPROVED" } }),
    prisma.property.count({ where: { sellerId: req.user.id, status: "PENDING" } }),
    prisma.property.count({ where: { sellerId: req.user.id, status: "REJECTED" } }),
    prisma.property.aggregate({ where: { sellerId: req.user.id }, _sum: { likesCount: true } }),
    prisma.property.aggregate({ where: { sellerId: req.user.id }, _sum: { viewCount: true } }),
    prisma.comment.count({ where: { property: { sellerId: req.user.id } } }),
  ]);

  return ok(res, {
    total, approved, pending, rejected,
    totalLikes: totalLikes._sum.likesCount || 0,
    totalViews: totalViews._sum.viewCount || 0,
    totalComments,
  });
});

module.exports = { updateMe, sellerStats };
