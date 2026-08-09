import { api } from "./client";

export const vastuApi = {
  analyzeLand: (payload) => api.post("/vastu/land/analyze", payload),
  analyzeHome: (payload) => api.post("/vastu/home/analyze", payload),
  getAnalysis: (id) => api.get(`/vastu/analyses/${id}`),
  myAnalyses: () => api.get("/vastu/analyses"),
  explain: (id) => api.post(`/vastu/analyses/${id}/explain`),
};
