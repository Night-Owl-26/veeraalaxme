import { api } from "./client";

export const geoApi = {
  search: (q) => api.get(`/geo/search?q=${encodeURIComponent(q)}`),
};
