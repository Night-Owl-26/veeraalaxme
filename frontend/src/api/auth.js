import { api } from "./client";

export const authApi = {
  registerRequestOtp: (payload) => api.post("/auth/register/request-otp", payload),
  registerVerifyOtp: (payload) => api.post("/auth/register/verify-otp", payload),
  login: (payload) => api.post("/auth/login", payload),
  forgotPassword: (payload) => api.post("/auth/password/forgot", payload),
  resetPassword: (payload) => api.post("/auth/password/reset", payload),
  refresh: () => api.post("/auth/refresh"),
  logout: () => api.post("/auth/logout"),
  me: () => api.get("/auth/me"),
};
