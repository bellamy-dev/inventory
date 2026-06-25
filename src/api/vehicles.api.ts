import api from "./client";

export const vehiclesApi = {
  getAll: () => api.get("/vehicles").then((r) => r.data.vehicles),

  create: (fd: FormData) =>
    api.post("/vehicles", fd).then((r) => r.data.vehicle),

  update: (id: string, fd: FormData) =>
    api.put(`/vehicles/${id}`, fd).then((r) => r.data.vehicle),

  delete: (id: string) =>
    api.delete(`/vehicles/${id}`).then((r) => r.data),

  getItems: (vehicleId: string) =>
    api.get(`/vehicles/${vehicleId}/items`).then((r) => r.data.items),

  addItem: (vehicleId: string, itemTypeId: string, quantity: number) =>
    api.post(`/vehicles/${vehicleId}/items`, { itemTypeId, quantity }).then((r) => r.data.item),

  removeItem: (vehicleId: string, itemTypeId: string, quantity: number) =>
    api.delete(`/vehicles/${vehicleId}/items/${itemTypeId}`, { data: { quantity } }).then((r) => r.data),

  updatePositions: (positions: { vehicleId: string; position: number }[]) =>
    api.put("/vehicles/positions/update", { positions }).then((r) => r.data),

  updateItemPositions: (vehicleId: string, positions: { itemTypeId: string; position: number }[]) =>
    api.put(`/vehicles/${vehicleId}/item-positions`, { positions }).then((r) => r.data),

  moveItem: (
    fromType: "stock" | "vehicle",
    fromId: string,
    toType: "stock" | "vehicle",
    toId: string,
    itemTypeId: string,
    quantity: number
  ) =>
    api.post("/vehicles/move", { fromType, fromId, toType, toId, itemTypeId, quantity }).then((r) => r.data),
};
