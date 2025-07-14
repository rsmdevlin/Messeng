import { useEffect, useRef, useCallback } from "react";
import { getAuthToken } from "@/lib/authUtils";

export function useWebSocket(onMessage?: (data: any) => void) {
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const messageQueue = useRef<any[]>([]);
  const isReady = useRef(false);

  const connect = useCallback(() => {
    const token = getAuthToken();
    if (!token) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log("WebSocket connected");
      reconnectAttempts.current = 0;
      isReady.current = true;

      // Authenticate
      ws.current?.send(JSON.stringify({
        type: 'auth',
        sessionId: token
      }));

      // Send any queued messages
      messageQueue.current.forEach(msg => {
        ws.current?.send(JSON.stringify(msg));
      });
      messageQueue.current = []; // Clear the queue after sending
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'chat_message') {
          // Handle the incoming message to avoid duplicates
          // This might involve checking if the message is already displayed
          // or using a unique message ID to prevent rendering the same message twice.
          console.log("Received message:", data);
          onMessage?.(data);
        } else {
          onMessage?.(data);
        }
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    ws.current.onclose = () => {
      console.log("WebSocket disconnected");
      isReady.current = false;

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
      isReady.current = false;
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
      isReady.current = false;
    }
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN && isReady.current) {
      ws.current.send(JSON.stringify(message));
    } else {
      // Queue the message if WebSocket is not ready
      messageQueue.current.push(message);
      console.log("Message queued, WebSocket not ready");
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