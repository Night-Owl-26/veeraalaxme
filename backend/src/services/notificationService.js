const prisma = require("../config/db");

// Centralizes notification creation so every code path (likes, comments,
// approvals, messages) produces a consistent shape, and so the Socket.IO
// push and the DB write always happen together.
async function notify(io, { userId, type, message, link = null }) {
  const notification = await prisma.notification.create({
    data: { userId, type, message, link },
  });
  io?.to(`user:${userId}`).emit("notification", notification);
  return notification;
}

module.exports = { notify };
