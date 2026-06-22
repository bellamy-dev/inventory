import api from "./client";

export const raritiesApi = {
  getAll: () => api.get("/rarities").then((r) => r.data.rarities),

  create: (data: { name: string; color: string }) =>
    api.post("/rarities", data).then((r) => r.data.rarity),

  update: (id: string, data: { name?: string; color?: string }) =>
    api.put(`/rarities/${id}`, data).then((r) => r.data.rarity),

  delete: (id: string) =>
    api.delete(`/rarities/${id}`).then((r) => r.data),
};
