const prisma = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const { ok, fail } = require("../utils/apiResponse");
const { notify } = require("../services/notificationService");

// GET /api/chat/threads
const listThreads = asyncHandler(async (req, res) => {
  const threads = await prisma.chatThread.findMany({
    where: { OR: [{ buyerId: req.user.id }, { sellerId: req.user.id }] },
    include: {
      buyer: true, seller: true, property: true,
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  const data = threads.map((t) => {
    const other = t.buyerId === req.user.id ? t.seller : t.buyer;
    return {
      id: t.id,
      property: t.property ? { id: t.property.id, title: t.property.title } : null,
      otherUser: { id: other.id, name: other.name },
      lastMessage: t.messages[0] || null,
    };
  });
  return ok(res, { items: data });
});

// POST /api/chat/threads — start or fetch existing thread with a seller
const startThread = asyncHandler(async (req, res) => {
  const { sellerId, propertyId } = req.body;
  if (sellerId === req.user.id) return fail(res, 400, "You can't message yourself");

  const seller = await prisma.user.findUnique({ where: { id: sellerId } });
  if (!seller || seller.role === "BUYER") return fail(res, 404, "Seller not found");

  let thread = await prisma.chatThread.findFirst({
    where: { buyerId: req.user.id, sellerId, propertyId: propertyId || null },
  });
  if (!thread) {
    thread = await prisma.chatThread.create({ data: { buyerId: req.user.id, sellerId, propertyId: propertyId || null } });
  }
  return ok(res, { thread }, 201);
});

// GET /api/chat/threads/:id/messages
const getMessages = asyncHandler(async (req, res) => {
  const thread = await prisma.chatThread.findUnique({ where: { id: req.params.id } });
  if (!thread) return fail(res, 404, "Conversation not found");
  if (thread.buyerId !== req.user.id && thread.sellerId !== req.user.id) return fail(res, 403, "Not your conversation");

  const messages = await prisma.chatMessage.findMany({
    where: { threadId: thread.id },
    orderBy: { createdAt: "asc" },
    take: 200,
  });

  await prisma.chatMessage.updateMany({
    where: { threadId: thread.id, senderId: { not: req.user.id }, readAt: null },
    data: { readAt: new Date() },
  });

  return ok(res, { messages });
});

// POST /api/chat/threads/:id/messages — REST fallback; Socket.IO also emits these in real time
const sendMessage = asyncHandler(async (req, res) => {
  const thread = await prisma.chatThread.findUnique({ where: { id: req.params.id } });
  if (!thread) return fail(res, 404, "Conversation not found");
  if (thread.buyerId !== req.user.id && thread.sellerId !== req.user.id) return fail(res, 403, "Not your conversation");

  const message = await prisma.chatMessage.create({
    data: { threadId: thread.id, senderId: req.user.id, text: req.body.text },
  });

  const recipientId = thread.buyerId === req.user.id ? thread.sellerId : thread.buyerId;
  req.app.get("io")?.to(`user:${recipientId}`).emit("chat:message", { threadId: thread.id, message });
  await notify(req.app.get("io"), { userId: recipientId, type: "MESSAGE", message: `New message from ${req.user.name}`, link: `/chat/${thread.id}` });

  return ok(res, { message }, 201);
});

module.exports = { listThreads, startThread, getMessages, sendMessage };
