import api from "./client";

export const harvestsApi = {
  getHarvestableItems: () =>
    api.get("/harvests/items").then((r) => r.data.items),

  declare: (itemTypeId: string, quantity: number) =>
    api.post("/harvests", { itemTypeId, quantity }).then((r) => r.data.harvest),

  getMine: () => api.get("/harvests/mine").then((r) => r.data.harvests),

  getAll: (filters?: { status?: string; userId?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.set("status", filters.status);
    if (filters?.userId) params.set("userId", filters.userId);
    const qs = params.toString();
    return api.get(`/harvests${qs ? `?${qs}` : ""}`).then((r) => r.data.harvests);
  },

  approve: (id: string) =>
    api.post(`/harvests/${id}/approve`).then((r) => r.data.harvest),

  reject: (id: string) =>
    api.post(`/harvests/${id}/reject`).then((r) => r.data.harvest),

  cancel: (id: string) =>
    api.post(`/harvests/${id}/cancel`).then((r) => r.data.harvest),

  getStats: () => api.get("/harvests/stats").then((r) => r.data.stats),

  markPaid: (userId: string) =>
    api.post(`/harvests/users/${userId}/mark-paid`).then((r) => r.data.payout),

  getPayoutHistory: () =>
    api.get("/harvests/payouts/history").then((r) => r.data.history),
};
