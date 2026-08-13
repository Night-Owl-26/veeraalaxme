import { api } from "./client";

export const adminApi = {
  listRecent: () => api.get("/admin/properties/recent"),
  listUsers: () => api.get("/admin/users"),
  approve: (id) => api.patch(`/admin/properties/${id}/approve`),
  reject: (id, reason) => api.patch(`/admin/properties/${id}/reject`, { reason }),
  verifyDocuments: (id) => api.patch(`/admin/properties/${id}/verify-documents`),
  setBlacklist: (id, blacklisted) => api.patch(`/admin/users/${id}/blacklist`, { blacklisted }),
  verifySeller: (id, verified) => api.patch(`/admin/users/${id}/verify-seller`, { verified }),
  analytics: () => api.get("/admin/analytics"),
  listReports: () => api.get("/admin/reports"),
  resolveReport: (id, status) => api.patch(`/admin/reports/${id}`, { status }),
};
