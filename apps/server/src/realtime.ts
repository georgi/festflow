import type http from "node:http";
import { WebSocketServer } from "ws";
import type WebSocket from "ws";

export type RealtimeEvent =
  | { type: "hello"; ts: number }
  | { type: "db.change"; ts: number; entity: string; id?: string };

export function createRealtimeServer(server: http.Server) {
  const wss = new WebSocketServer({ server, path: "/ws" });
  const clients = new Set<WebSocket>();

  wss.on("connection", (socket) => {
    clients.add(socket);
    socket.send(JSON.stringify({ type: "hello", ts: Date.now() } satisfies RealtimeEvent));

    socket.on("close", () => {
      clients.delete(socket);
    });
  });

  function broadcast(event: RealtimeEvent) {
    const message = JSON.stringify(event);
    for (const client of clients) {
      if (client.readyState === client.OPEN) {
        client.send(message);
      }
    }
  }

  return { broadcast, clientsCount: () => clients.size };
}
