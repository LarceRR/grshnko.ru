import { useState, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAppDispatch } from "../store/hooks";
import { setChatQuestionnaire, setIsStreaming } from "../features/chatSlice";
import { chatApi } from "../api/chat";
import { API_URL } from "../config";
import type { ToolCallEvent, QuestionnaireData } from "../types/chat.types";

/**
 * Map backend questionnaire displayData to frontend QuestionnaireData.
 */
export function mapToolResultToQuestionnaire(displayData: unknown): {
  question?: string;
  options: {
    title: string;
    description?: string;
    value?: string;
    image?: string;
  }[];
  groups?: {
    label?: string;
    question?: string;
    options: { title: string; value?: string; description?: string }[];
  }[];
} | null {
  if (!displayData || typeof displayData !== "object") return null;

  const d = displayData as Record<string, unknown>;

  // Case 1: Already in frontend shape { question?, options: [{ title, ... }] }
  if (Array.isArray(d.options) && d.options.length > 0) {
    const first = d.options[0];
    if (first && typeof first === "object" && "title" in first) {
      return {
        question:
          typeof d.question === "string"
            ? d.question
            : typeof d.title === "string"
              ? d.title
              : undefined,
        options: (d.options as Array<Record<string, unknown>>).map((o) => ({
          title: String(o.title ?? ""),
          description: o.description ? String(o.description) : undefined,
          value: o.value ? String(o.value) : String(o.title ?? ""),
          image: o.image ? String(o.image) : undefined,
        })),
      };
    }
    if (typeof first === "string") {
      return {
        question:
          typeof d.title === "string"
            ? d.title
            : typeof d.question === "string"
              ? d.question
              : undefined,
        options: (d.options as string[]).map((opt) => ({
          title: opt,
          value: opt,
        })),
      };
    }
  }

  // Case 2: Backend shape { title, questions: [{ id, question, label, type, options }] }
  const title = typeof d.title === "string" ? d.title : undefined;
  const questions = Array.isArray(d.questions) ? d.questions : [];

  const groups: {
    label?: string;
    question?: string;
    type?: "select" | "multiselect";
    options: { title: string; value?: string; description?: string }[];
  }[] = [];
  const flatCards: { title: string; description?: string; value?: string }[] =
    [];

  for (const raw of questions) {
    if (!raw || typeof raw !== "object") continue;
    const q = raw as {
      id?: string;
      label?: string;
      question?: string;
      type?: string;
      options?: string[];
    };
    const displayText = q.question || q.label || "";
    const shortTitle = q.id
      ? q.id.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      : displayText.slice(0, 50);
    const isChoice =
      (q.type === "select" || q.type === "multiselect") &&
      Array.isArray(q.options) &&
      q.options.length > 0;
    const groupType = q.type === "multiselect" ? "multiselect" : "select";

    if (isChoice) {
      const groupLabel = q.label || shortTitle;
      const groupOptions = (q.options as string[]).map((opt) => ({
        title: String(opt),
        value: String(opt),
      }));
      groups.push({
        label: groupLabel,
        question: displayText || undefined,
        type: groupType,
        options: groupOptions,
      });
      for (const opt of q.options!) {
        flatCards.push({
          title: String(opt),
          value: String(opt),
          description: groupLabel || undefined,
        });
      }
    } else if (q.type !== "select" && q.type !== "multiselect") {
      groups.push({
        label: q.label || shortTitle,
        question: displayText || undefined,
        type: "select",
        options: [
          {
            title: q.label || shortTitle,
            value: q.id,
            description: displayText || undefined,
          },
        ],
      });
      flatCards.push({
        title: q.label || shortTitle,
        value: q.id,
        description: displayText || undefined,
      });
    }
  }

  if (groups.length === 0) return null;
  return { question: title, options: flatCards, groups };
}

function decodeUnicodeEscapes(text: string): string {
  return text.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16)),
  );
}

export function useChat(sessionId: string | null) {
  const [streamingContent, setStreamingContent] = useState("");
  const [toolCalls, setToolCalls] = useState<ToolCallEvent[]>([]);
  const [pendingUserMessage, setPendingUserMessage] = useState<string | null>(
    null,
  );
  const [streamError, setStreamError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  const executeStream = useCallback(
    async (url: string, body: object, initialUserMessage: string | null = null) => {
      if (!sessionId) return;
      
      dispatch(setIsStreaming(true));
      setPendingUserMessage(initialUserMessage);
      setStreamingContent("");
      setToolCalls([]);
      setStreamError(null);
      abortRef.current = new AbortController();

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
          signal: abortRef.current.signal,
        });

        if (!response.body) {
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() || "";

          for (const block of parts) {
            if (!block.trim()) continue;
            
            let type = "message";
            let data: unknown = null;
            
            for (const line of block.split("\n")) {
              if (line.startsWith("event:")) type = line.slice(6).trim();
              if (line.startsWith("data:")) {
                const dataStr = line.slice(5).trim();
                try {
                  data = JSON.parse(dataStr);
                } catch {
                  data = dataStr;
                }
              }
            }

            switch (type) {
              case "token":
                setStreamingContent(
                  (prev) =>
                    prev +
                    (data && typeof data === "object" && "content" in data
                      ? decodeUnicodeEscapes(String((data as { content: string }).content))
                      : ""),
                );
                break;
              case "tool_call_start":
                setToolCalls((prev) => [
                  ...prev,
                  { ...(data as object), status: "running" } as ToolCallEvent,
                ]);
                break;
              case "tool_call_result": {
                const payload = data as {
                  callId?: string;
                  displayType?: string;
                  displayData?: unknown;
                };
                setToolCalls((prev) =>
                  prev.map((tc) =>
                    payload?.callId === tc.callId
                      ? { ...tc, ...(data as object), status: "done" }
                      : tc,
                  ),
                );
                if (payload?.displayType === "questionnaire" && payload?.displayData) {
                  const mapped = mapToolResultToQuestionnaire(payload.displayData);
                  if (mapped && mapped.options.length > 0)
                    dispatch(setChatQuestionnaire({ questionnaire: mapped, sessionId }));
                }
                break;
              }
              case "questionnaire":
                dispatch(setChatQuestionnaire({ questionnaire: (data as QuestionnaireData) ?? null, sessionId }));
                break;
              case "session_title":
                queryClient.setQueryData(["chat", "session", sessionId], (prev: unknown) =>
                  prev && typeof prev === "object"
                    ? { ...prev, title: (data as { title: string })?.title }
                    : prev,
                );
                queryClient.invalidateQueries({ queryKey: ["chat", "sessions"] });
                break;
              case "error": {
                const errMsg = data && typeof data === "object" && "message" in data
                  ? String((data as { message: string }).message)
                  : "Произошла ошибка";
                setStreamError(errMsg);
                break;
              }
              case "done":
                queryClient.invalidateQueries({ queryKey: ["chat", "messages", sessionId] });
                break;
            }
          }
        }
      } catch (err) {
        if ((err as Error)?.name !== "AbortError") {
          console.error("Chat stream error:", err);
          setStreamError("Ошибка соединения");
        }
      } finally {
        dispatch(setIsStreaming(false));
        setPendingUserMessage(null);
        setStreamingContent("");
        setToolCalls([]);
      }
    },
    [sessionId, dispatch, queryClient],
  );

  const sendMessage = useCallback(
    (content: string, modelOverride?: string) => {
      const url = `${API_URL}api/chat/sessions/${sessionId}/messages/stream`;
      return executeStream(url, { content, modelOverride }, content);
    },
    [sessionId, executeStream],
  );

  const stopGeneration = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    if (sessionId) chatApi.stopGeneration(sessionId).catch(() => {});
  }, [sessionId]);

  const editMessage = useCallback(
    (messageId: string, content: string, modelOverride?: string) => {
      const url = `${API_URL}api/chat/sessions/${sessionId}/messages/${messageId}/edit/stream`;
      return executeStream(url, { content, modelOverride });
    },
    [sessionId, executeStream],
  );

  const regenerateMessage = useCallback(
    (messageId: string) => {
      const url = `${API_URL}api/chat/sessions/${sessionId}/messages/${messageId}/regenerate/stream`;
      return executeStream(url, {});
    },
    [sessionId, executeStream],
  );

  const clearStreamError = useCallback(() => setStreamError(null), []);

  return {
    sendMessage,
    editMessage,
    regenerateMessage,
    stopGeneration,
    streamingContent,
    toolCalls,
    pendingUserMessage,
    streamError,
    clearStreamError,
  };
}
