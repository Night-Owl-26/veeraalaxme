const { verifyAccessToken } = require("../utils/jwt");

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

    socket.on("chat:typing", ({ threadId, toUserId }) => {
      io.to(`user:${toUserId}`).emit("chat:typing", { threadId, fromUserId: socket.userId });
    });

    socket.on("disconnect", () => {
      // room membership is cleaned up automatically by socket.io
    });
  });
}

module.exports = { initChatSocket };
