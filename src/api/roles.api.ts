import api from "./client";
import { Permission } from "../types";

export const rolesApi = {
  getAll: () => api.get("/roles").then((r) => r.data.roles),

  create: (data: { name: string; color: string; permissions: Permission[] }) =>
    api.post("/roles", data).then((r) => r.data.role),

  update: (id: string, data: { name?: string; color?: string }) =>
    api.put(`/roles/${id}`, data).then((r) => r.data.role),

  delete: (id: string) => api.delete(`/roles/${id}`).then((r) => r.data),

  updateHierarchy: (roleOrders: { id: string; position: number }[]) =>
    api.put("/roles/hierarchy", { roleOrders }).then((r) => r.data.roles),

  updatePermissions: (roleId: string, permissions: Permission[]) =>
    api
      .put(`/roles/${roleId}/permissions`, { permissions })
      .then((r) => r.data.role),
};
