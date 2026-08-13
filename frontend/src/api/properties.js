import { api } from "./client";

function toQuery(params) {
  const usp = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "" || v === false || (Array.isArray(v) && v.length === 0)) return;
    usp.set(k, Array.isArray(v) ? v.join(",") : String(v));
  });
  const s = usp.toString();
  return s ? `?${s}` : "";
}

export const propertiesApi = {
  list: (params) => api.get(`/properties${toQuery(params)}`),
  mine: () => api.get("/properties/mine"),
  saved: () => api.get("/properties/saved"),
  getById: (id) => api.get(`/properties/${id}`),
  create: (payload) => api.post("/properties", payload),
  update: (id, payload) => api.patch(`/properties/${id}`, payload),
  remove: (id) => api.del(`/properties/${id}`),
  uploadImages: (id, files) => {
    const form = new FormData();
    [...files].forEach((f) => form.append("images", f));
    return api.postForm(`/properties/${id}/images`, form);
  },
  uploadDocuments: (id, files, label) => {
    const form = new FormData();
    [...files].forEach((f) => form.append("documents", f));
    if (label) form.append("label", label);
    return api.postForm(`/properties/${id}/documents`, form);
  },
  like: (id) => api.post(`/properties/${id}/like`),
  save: (id) => api.post(`/properties/${id}/save`),
  comment: (id, text) => api.post(`/properties/${id}/comments`, { text }),
  deleteComment: (commentId) => api.del(`/comments/${commentId}`),
  report: (id, payload) => api.post(`/properties/${id}/report`, payload),
};
