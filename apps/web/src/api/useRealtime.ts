import { useEffect, useRef, useState } from "react";

type RealtimeEvent =
  | { type: "hello"; ts: number }
  | { type: "db.change"; ts: number; entity: string; id?: string };

export function useRealtime(onChange?: () => void) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const [status, setStatus] = useState<"connecting" | "live" | "reconnecting" | "offline">("connecting");

  useEffect(() => {
    let active = true;
    let ws: WebSocket | null = null;
    let retryTimer: number | null = null;

    const connect = () => {
      if (!active) return;
      setStatus((prev) => (prev === "offline" ? "reconnecting" : "connecting"));
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setStatus("live");
      };

      ws.onclose = () => {
        if (!active) return;
        setStatus("reconnecting");
        retryTimer = window.setTimeout(connect, 1200);
      };

      ws.onerror = () => {
        if (!active) return;
        setStatus("reconnecting");
        // Ensure we actually reconnect if the socket fails without a close event.
        ws?.close();
      };

      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(String(ev.data)) as RealtimeEvent;
          if (msg.type === "db.change") {
            onChangeRef.current?.();
          }
        } catch {
          // ignore malformed messages
        }
      };
    };

    connect();

    return () => {
      active = false;
      setStatus("offline");
      if (retryTimer) window.clearTimeout(retryTimer);
      ws?.close();
    };
  }, []);

  return status;
}
