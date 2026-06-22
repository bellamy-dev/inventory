import api from "./client";

export const itemTypesApi = {
  getAll: (categoryId?: string, search?: string) => {
    const params = new URLSearchParams();
    if (categoryId) params.set("categoryId", categoryId);
    if (search) params.set("search", search);
    const qs = params.toString();
    return api.get(`/items${qs ? `?${qs}` : ""}`).then((r) => r.data.items);
  },

  getOne: (id: string) =>
    api.get(`/items/${id}`).then((r) => r.data.item),

  create: (formData: FormData) =>
    api
      .post("/items", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data.item),

  update: (id: string, formData: FormData) =>
    api
      .put(`/items/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data.item),

  delete: (id: string) =>
    api.delete(`/items/${id}`).then((r) => r.data),
};
