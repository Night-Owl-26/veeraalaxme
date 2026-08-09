import { api } from "./client";

export const chatApi = {
  listThreads: () => api.get("/chat/threads"),
  startThread: (sellerId, propertyId) => api.post("/chat/threads", { sellerId, propertyId }),
  getMessages: (threadId) => api.get(`/chat/threads/${threadId}/messages`),
  sendMessage: (threadId, text) => api.post(`/chat/threads/${threadId}/messages`, { text }),
};
