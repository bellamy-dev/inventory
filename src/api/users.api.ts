import api from "./client";

export const usersApi = {
  getAll: () => api.get("/users").then((r) => r.data.users),

  create: (data: { username: string; password: string; roleId: string }) =>
    api.post("/users", data).then((r) => r.data.user),

  delete: (id: string) => api.delete(`/users/${id}`).then((r) => r.data),

  updateRole: (userId: string, roleId: string) =>
    api.patch(`/users/${userId}/role`, { roleId }).then((r) => r.data.user),
};
