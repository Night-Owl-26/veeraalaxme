import { api } from "./client";

export const paymentsApi = {
  createOrder: (payload) => api.post("/payments/create-order", payload),
  verify: (payload) => api.post("/payments/verify", payload),
};
