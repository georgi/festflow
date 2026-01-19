import { useEffect, useRef } from "react";

type RealtimeEvent =
  | { type: "hello"; ts: number }
  | { type: "db.change"; ts: number; entity: string; id?: string };

export function useRealtime(onChange: () => void) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(String(ev.data)) as RealtimeEvent;
        if (msg.type === "db.change") {
          onChangeRef.current();
        }
      } catch {
        // ignore malformed messages
      }
    };

    return () => ws.close();
  }, []);
}

