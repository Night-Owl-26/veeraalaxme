import { api } from "./client";

export const authApi = {
  requestOtp: (payload) => api.post("/auth/otp/request", payload),
  verifyOtp: (payload) => api.post("/auth/otp/verify", payload),
  refresh: () => api.post("/auth/refresh"),
  logout: () => api.post("/auth/logout"),
  me: () => api.get("/auth/me"),
};
