const prisma = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const { ok } = require("../utils/apiResponse");

// GET /api/notifications
const listNotifications = asyncHandler(async (req, res) => {
  const items = await prisma.notification.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const unreadCount = await prisma.notification.count({ where: { userId: req.user.id, read: false } });
  return ok(res, { items, unreadCount });
});

// PATCH /api/notifications/:id/read
const markRead = asyncHandler(async (req, res) => {
  await prisma.notification.updateMany({ where: { id: req.params.id, userId: req.user.id }, data: { read: true } });
  return ok(res, { updated: true });
});

// PATCH /api/notifications/read-all
const markAllRead = asyncHandler(async (req, res) => {
  await prisma.notification.updateMany({ where: { userId: req.user.id, read: false }, data: { read: true } });
  return ok(res, { updated: true });
});

module.exports = { listNotifications, markRead, markAllRead };
