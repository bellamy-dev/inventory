import api from "./client";

export const authApi = {
  login: (username: string, password: string) =>
    api.post("/auth/login", { username, password }).then((r) => r.data),

  refresh: () => api.post("/auth/refresh").then((r) => r.data),

  logout: () => api.post("/auth/logout").then((r) => r.data),

  me: () => api.get("/auth/me").then((r) => r.data),
};
