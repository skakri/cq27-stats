import { useEffect, useRef, useState, useCallback } from "react";
import type { SignalMessage } from "../types";

type SignalHandler = (msg: SignalMessage) => void;

export function useSignals(onSignal: SignalHandler) {
  const [connected, setConnected] = useState(false);
  const handlerRef = useRef(onSignal);
  handlerRef.current = onSignal;

  const reconnectDelay = useRef(1000);
  const wsRef = useRef<WebSocket | null>(null);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    const proto = location.protocol === "https:" ? "wss:" : "ws:";
    const base = import.meta.env.VITE_API_URL || `${proto}//${location.host}`;
    const wsUrl = base.replace(/^http/, "ws") + "/api/v1/ws/signals";

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) return;
      setConnected(true);
      reconnectDelay.current = 1000;
    };

    ws.onmessage = (ev) => {
      try {
        const msg: SignalMessage = JSON.parse(ev.data);
        handlerRef.current(msg);
      } catch {
        // ignore malformed messages
      }
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      setConnected(false);
      const delay = reconnectDelay.current;
      reconnectDelay.current = Math.min(delay * 2, 30_000);
      setTimeout(connect, delay);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [connect]);

  return connected;
}
