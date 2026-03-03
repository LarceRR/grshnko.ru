import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { API_URL } from "../config";

type ChatWsEvent = {
  event: string;
  data?: Record<string, unknown>;
};

function buildWsUrl(token?: string): string {
  let base: string;
  if (API_URL) {
    const b = API_URL.replace(/\/$/, "");
    base = b.replace(/^http/, "ws") + "/ws/chat";
  } else {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    base = `${protocol}//${window.location.host}/ws/chat`;
  }
  const sep = base.includes("?") ? "&" : "?";
  return token ? `${base}${sep}token=${encodeURIComponent(token)}` : base;
}

const RECONNECT_MIN_MS = 1_000;
const RECONNECT_MAX_MS = 5_000;
const FALLBACK_REFETCH_MS = 5_000;
const FALLBACK_AFTER_FAILED_RECONNECTS = 3;

/**
 * Maintains a WebSocket connection to /ws/chat and joins the given sessionId room.
 * On incoming events (`message_created`, `tool_call_created`, `tool_call_updated`)
 * it invalidates the relevant React Query caches so other tabs stay in sync.
 */
export function useChatSocket(sessionId: string | null) {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectDelay = useRef(RECONNECT_MIN_MS);
  const currentSessionId = useRef(sessionId);
  const mountedRef = useRef(true);
  const connectingRef = useRef(false);
  const failedReconnectsRef = useRef(0);
  const fallbackTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  currentSessionId.current = sessionId;

  const handleEvent = useCallback(
    (evt: ChatWsEvent) => {
      const sid = currentSessionId.current;

      switch (evt.event) {
        case "message_created":
          if (sid) {
            queryClient.refetchQueries({
              queryKey: ["chat", "messages", sid],
            });
          }
          queryClient.invalidateQueries({
            queryKey: ["chat", "sessions"],
          });
          break;
        case "tool_call_created":
        case "tool_call_updated":
          if (sid) {
            queryClient.refetchQueries({
              queryKey: ["chat", "messages", sid],
            });
          }
          break;
        case "read_state_updated":
          if (sid) {
            queryClient.refetchQueries({
              queryKey: ["chat", "session", sid],
            });
          }
          queryClient.invalidateQueries({
            queryKey: ["chat", "sessions"],
          });
          break;
        case "session_updated":
          queryClient.invalidateQueries({
            queryKey: ["chat", "sessions"],
          });
          break;
      }
    },
    [queryClient],
  );

  const joinSession = useCallback(
    (ws: WebSocket, sid: string) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ event: "joinSession", data: { sessionId: sid } }));
      }
    },
    [],
  );

  const leaveSession = useCallback(
    (ws: WebSocket, sid: string) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ event: "leaveSession", data: { sessionId: sid } }));
      }
    },
    [],
  );

  const stopFallbackRefetch = useCallback(() => {
    if (fallbackTimerRef.current) {
      clearInterval(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  }, []);

  const startFallbackRefetch = useCallback(() => {
    if (fallbackTimerRef.current) return;
    fallbackTimerRef.current = setInterval(() => {
      const sid = currentSessionId.current;
      if (!sid || document.visibilityState !== "visible") return;
      queryClient.refetchQueries({
        queryKey: ["chat", "messages", sid],
      });
      queryClient.refetchQueries({
        queryKey: ["chat", "session", sid],
      });
    }, FALLBACK_REFETCH_MS);
  }, [queryClient]);

  const connect = useCallback(() => {
    if (!mountedRef.current || connectingRef.current || wsRef.current) return;
    connectingRef.current = true;

    void fetch(`${API_URL}api/sessions/me`, {
      method: "GET",
      credentials: "include",
    })
      .then(async () => {
        try {
          const wsTokenResponse = await fetch(`${API_URL}api/chat/ws-token`, {
            method: "GET",
            credentials: "include",
          });
          if (!wsTokenResponse.ok) return undefined;
          const payload = (await wsTokenResponse.json()) as { token?: string };
          return typeof payload?.token === "string" ? payload.token : undefined;
        } catch {
          return undefined;
        }
      })
      .catch(() => undefined)
      .then((wsToken) => {
        if (!mountedRef.current || wsRef.current) {
          connectingRef.current = false;
          return;
        }

        const url = buildWsUrl(wsToken);
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
          connectingRef.current = false;
          reconnectDelay.current = RECONNECT_MIN_MS;
          failedReconnectsRef.current = 0;
          stopFallbackRefetch();
          const sid = currentSessionId.current;
          if (sid) joinSession(ws, sid);
        };

        ws.onmessage = (e) => {
          try {
            const parsed: ChatWsEvent = JSON.parse(e.data);
            handleEvent(parsed);
          } catch {
            // ignore malformed frames
          }
        };

        ws.onclose = (evt) => {
          console.warn("[chat-ws] close", {
            code: evt.code,
            reason: evt.reason || "(empty)",
            wasClean: evt.wasClean,
            readyState: ws.readyState,
            url,
          });
          wsRef.current = null;
          connectingRef.current = false;
          failedReconnectsRef.current += 1;
          if (failedReconnectsRef.current > FALLBACK_AFTER_FAILED_RECONNECTS) {
            startFallbackRefetch();
          }
          if (!mountedRef.current) return;
          reconnectTimer.current = setTimeout(() => {
            reconnectDelay.current = Math.min(reconnectDelay.current * 2, RECONNECT_MAX_MS);
            connect();
          }, reconnectDelay.current);
        };

        ws.onerror = () => {
          console.warn("[chat-ws] error", { readyState: ws.readyState, url });
          ws.close();
        };
      });
  }, [handleEvent, joinSession, startFallbackRefetch, stopFallbackRefetch]);

  // Connect on mount, cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      stopFallbackRefetch();
      connectingRef.current = false;
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [connect, stopFallbackRefetch]);

  // Join / leave rooms when sessionId changes
  useEffect(() => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    // We re-join the new session; the server will handle the old subscription
    // through the leaveSession + joinSession pattern
    if (sessionId) {
      joinSession(ws, sessionId);
    }

    return () => {
      if (sessionId && ws.readyState === WebSocket.OPEN) {
        leaveSession(ws, sessionId);
      }
    };
  }, [sessionId, joinSession, leaveSession]);

}
