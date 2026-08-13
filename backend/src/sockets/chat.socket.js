const { verifyAccessToken } = require("../utils/jwt");
const prisma = require("../config/db");

// Every socket connection must present the same JWT access token used for
// REST calls — sockets are not a separate, weaker auth path. Each user joins
// a private room (`user:<id>`) so server code anywhere can push events to
// them by id without tracking raw socket ids.
function initChatSocket(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication required"));
    try {
      const payload = verifyAccessToken(token);
      socket.userId = payload.sub;
      next();
    } catch (e) {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(`user:${socket.userId}`);

    socket.on("chat:typing", async ({ threadId, toUserId }) => {
      if (!threadId || !toUserId) return;
      // Confirm the sender is actually a participant of this thread, and that
      // toUserId is the OTHER participant — otherwise any authenticated socket
      // could name an arbitrary threadId/toUserId and get it relayed as-is.
      const thread = await prisma.chatThread.findUnique({ where: { id: threadId }, select: { buyerId: true, sellerId: true } });
      if (!thread) return;
      const participants = [thread.buyerId, thread.sellerId];
      if (!participants.includes(socket.userId) || !participants.includes(toUserId)) return;
      io.to(`user:${toUserId}`).emit("chat:typing", { threadId, fromUserId: socket.userId });
    });

    socket.on("disconnect", () => {
      // room membership is cleaned up automatically by socket.io
    });
  });
}

module.exports = { initChatSocket };
