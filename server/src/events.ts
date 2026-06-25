import { Response } from "express";

interface SSEClient {
  id: string;
  res: Response;
  userId?: string;
}

const clients: Map<string, SSEClient> = new Map();
let clientIdCounter = 0;

export function addClient(res: Response, userId?: string): string {
  const id = String(++clientIdCounter);

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.write("\n");

  clients.set(id, { id, res, userId });

  res.on("close", () => {
    clients.delete(id);
  });

  return id;
}

export function broadcast(event: string, data: Record<string, unknown>, excludeUserId?: string) {
  const payload = `data: ${JSON.stringify({ event, ...data })}\n\n`;
  for (const client of clients.values()) {
    if (excludeUserId && client.userId === excludeUserId) continue;
    try {
      client.res.write(payload);
    } catch {
      clients.delete(client.id);
    }
  }
}
