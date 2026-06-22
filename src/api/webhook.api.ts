import api from "./client";

export const webhookApi = {
  getConfig: () => api.get("/webhook").then((r) => r.data.config),

  updateConfig: (data: {
    discordUrl?: string;
    saleEvents?: boolean;
    itemEvents?: boolean;
  }) => api.put("/webhook", data).then((r) => r.data.config),

  test: () => api.post("/webhook/test").then((r) => r.data),
};
