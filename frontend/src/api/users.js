import { api } from "./client";

export const usersApi = {
  updateMe: (payload) => api.patch("/users/me", payload),
  sellerStats: () => api.get("/users/me/seller-stats"),
};
