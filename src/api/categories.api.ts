import api from "./client";

export const categoriesApi = {
  getAll: () => api.get("/categories").then((r) => r.data.categories),

  create: (name: string) =>
    api.post("/categories", { name }).then((r) => r.data.category),

  delete: (id: string) =>
    api.delete(`/categories/${id}`).then((r) => r.data),
};
