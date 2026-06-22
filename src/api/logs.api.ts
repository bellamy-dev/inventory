import api from "./client";

export const logsApi = {
  getAll: (params: { page?: number; limit?: number; action?: string }) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", String(params.page));
    if (params.limit) searchParams.set("limit", String(params.limit));
    if (params.action) searchParams.set("action", params.action);
    const qs = searchParams.toString();
    return api.get(`/logs${qs ? `?${qs}` : ""}`).then((r) => r.data);
  },
};
