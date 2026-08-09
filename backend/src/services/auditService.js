const prisma = require("../config/db");

// Every admin/moderation action that mutates another user's data should
// call this so there's a durable record of who did what, to what, and when.
async function recordAudit({ actorId, action, targetType, targetId, metadata }) {
  return prisma.auditLog.create({
    data: { actorId, action, targetType, targetId, metadata: metadata ?? undefined },
  });
}

module.exports = { recordAudit };
