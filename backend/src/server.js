const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const env = require("./config/env");
const { initChatSocket } = require("./sockets/chat.socket");

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: env.clientOrigin, credentials: true },
});
initChatSocket(io);

// Controllers reach the io instance via req.app.get("io") so notification/chat
// pushes can happen from anywhere without threading `io` through every function.
app.set("io", io);

server.listen(env.port, () => {
  console.log(`VasthuConnect API listening on http://localhost:${env.port} (${env.nodeEnv})`);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err);
});
