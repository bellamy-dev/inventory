import api from "./client";

export const salesApi = {
  getAll: (params: {
    startDate?: string;
    endDate?: string;
    sellerId?: string;
    itemTypeId?: string;
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.set(key, String(value));
      }
    });
    const qs = searchParams.toString();
    return api.get(`/sales${qs ? `?${qs}` : ""}`).then((r) => r.data);
  },

  create: (data: {
    itemTypeId: string;
    quantity: number;
    buyerName?: string;
  }) => api.post("/sales", data).then((r) => r.data.sale),

  getStats: (params: { startDate?: string; endDate?: string }) => {
    const searchParams = new URLSearchParams();
    if (params.startDate) searchParams.set("startDate", params.startDate);
    if (params.endDate) searchParams.set("endDate", params.endDate);
    const qs = searchParams.toString();
    return api
      .get(`/sales/stats${qs ? `?${qs}` : ""}`)
      .then((r) => r.data);
  },

  delete: (id: string) =>
    api.delete(`/sales/${id}`).then((r) => r.data),
};
