import { api } from "./client";

export const contactApi = {
  submit: (payload) => api.post("/contact", payload),
};
