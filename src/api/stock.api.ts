import api from "./client";

export const stockApi = {
  getAll: () => api.get("/stock").then((r) => r.data.stockItems),

  update: (itemTypeId: string, quantity: number) =>
    api.put(`/stock/${itemTypeId}`, { quantity }).then((r) => r.data.stock),

  add: (itemTypeId: string, amount: number) =>
    api
      .post(`/stock/${itemTypeId}/add`, { amount })
      .then((r) => r.data.stock),

  remove: (itemTypeId: string, amount: number, reason?: string) =>
    api
      .post(`/stock/${itemTypeId}/remove`, { amount, reason })
      .then((r) => r.data.stock),

  updatePositions: (
    positions: { itemTypeId: string; position: number }[]
  ) =>
    api.put("/stock/positions/update", { positions }).then((r) => r.data),
};
