import { api } from "./client";

export const aiApi = {
  propertyDescription: (payload) => api.post("/ai/property-description", payload),
  vastuInsight: (payload) => api.post("/ai/vastu-insight", payload),
};
