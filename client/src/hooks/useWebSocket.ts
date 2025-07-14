import { useEffect, useRef, useCallback } from "react";
import { getAuthToken } from "@/lib/authUtils";

export function useWebSocket(onMessage?: (data: any) => void) {
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    const token = getAuthToken();
    if (!token) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log("WebSocket connected");
      reconnectAttempts.current = 0;
      
      // Authenticate
      ws.current?.send(JSON.stringify({
        type: 'auth',
        sessionId: token
      }));
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage?.(data);
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    ws.current.onclose = () => {
      console.log("WebSocket disconnected");
      
      // Attempt to reconnect
      if (reconnectAttempts.current < maxReconnectAttempts) {
        reconnectAttempts.current++;
        reconnectTimeout.current = setTimeout(() => {
          connect();
        }, 1000 * reconnectAttempts.current);
      }
    };

    ws.current.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  }, [onMessage]);

  const disconnect = useCallback(() => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = null;
    }
    
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  }, []);

  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    sendMessage,
    disconnect,
    reconnect: connect,
  };
}
