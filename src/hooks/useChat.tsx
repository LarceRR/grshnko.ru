import { useState, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAppDispatch } from "../store/hooks";
import { setChatQuestionnaire, setIsStreaming } from "../features/chatSlice";
import { chatApi } from "../api/chat";
import { API_URL } from "../config";
import type { ToolCallEvent, QuestionnaireData } from "../types/chat.types";

/**
 * Map backend questionnaire displayData to frontend QuestionnaireData.
 *
 * Backend sends: { title, questions: [{ id, label, type, options }] }
 * For select/multiselect questions, each option becomes its own card.
 * For other types (text, boolean, etc.), the question itself becomes one card.
 *
 * Also handles alternative shapes:
 *   - { question, options: [{ title, description?, value? }] }  (already frontend format)
 *   - { title, options: string[] }  (flat list)
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
    // If options are objects with a title field, treat as already mapped
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
    // If options are plain strings, convert to cards
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
      // Only create a single "card" for non-choice questions (e.g. free text); never use question text as the only option for select/multiselect
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
    // If type is select/multiselect but options are missing or empty — skip: do not show the question as a fake option card
  }

  if (groups.length === 0) return null;
  return { question: title, options: flatCards, groups };
}

/**
 * Decode literal unicode escape sequences (e.g. "\u0434") that some LLM models
 * output as plain text instead of actual characters.
 */
function decodeUnicodeEscapes(text: string): string {
  // Match sequences like \u0434 (literal backslash-u-4hex)
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

  const sendMessage = useCallback(
    async (content: string, modelOverride?: string) => {
      if (!sessionId) return;
      dispatch(setIsStreaming(true));
      setPendingUserMessage(content);
      setStreamingContent("");
      setToolCalls([]);
      setStreamError(null);
      abortRef.current = new AbortController();

      const url = `${API_URL}api/chat/sessions/${sessionId}/messages/stream`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content, modelOverride }),
        signal: abortRef.current.signal,
      });

      if (!response.body) {
        dispatch(setIsStreaming(false));
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          while (buffer.includes("\n\n")) {
            const idx = buffer.indexOf("\n\n");
            const block = buffer.slice(0, idx);
            buffer = buffer.slice(idx + 2);
            let type = "message";
            let data: unknown = null;
            for (const line of block.split("\n")) {
              if (line.startsWith("event:")) type = line.slice(6).trim();
              if (line.startsWith("data:")) {
                try {
                  data = JSON.parse(line.slice(5).trim());
                } catch {
                  data = line.slice(5).trim();
                }
              }
            }
            switch (type) {
              case "token":
                setStreamingContent(
                  (prev) =>
                    prev +
                    (data && typeof data === "object" && "content" in data
                      ? decodeUnicodeEscapes(
                          String((data as { content: string }).content),
                        )
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
                if (
                  payload?.displayType === "questionnaire" &&
                  payload?.displayData
                ) {
                  const mapped = mapToolResultToQuestionnaire(
                    payload.displayData,
                  );
                  if (mapped && mapped.options.length > 0)
                    dispatch(
                      setChatQuestionnaire({
                        questionnaire: mapped,
                        sessionId,
                      }),
                    );
                }
                break;
              }
              case "questionnaire":
                dispatch(
                  setChatQuestionnaire({
                    questionnaire: (data as QuestionnaireData) ?? null,
                    sessionId,
                  }),
                );
                break;
              case "session_title":
                queryClient.setQueryData(
                  ["chat", "session", sessionId],
                  (prev: unknown) =>
                    prev && typeof prev === "object"
                      ? { ...prev, title: (data as { title: string })?.title }
                      : prev,
                );
                queryClient.invalidateQueries({
                  queryKey: ["chat", "sessions"],
                });
                break;
              case "error": {
                const errMsg =
                  data && typeof data === "object" && "message" in data
                    ? String((data as { message: string }).message)
                    : "Произошла ошибка";
                console.error("Chat stream error:", data);
                setStreamError(errMsg);
                break;
              }
              case "done":
                queryClient.invalidateQueries({
                  queryKey: ["chat", "messages", sessionId],
                });
                break;
              default:
                break;
            }
          }
        }
      } catch (err) {
        if ((err as Error)?.name !== "AbortError") throw err;
      } finally {
        dispatch(setIsStreaming(false));
        setPendingUserMessage(null);
        setStreamingContent("");
        setToolCalls([]);
      }
    },
    [sessionId, dispatch, queryClient],
  );

  const stopGeneration = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    if (sessionId) chatApi.stopGeneration(sessionId).catch(() => {});
  }, [sessionId]);

  const editMessage = useCallback(
    async (messageId: string, content: string, modelOverride?: string) => {
      if (!sessionId) return;
      dispatch(setIsStreaming(true));
      setStreamingContent("");
      setToolCalls([]);
      setStreamError(null);
      abortRef.current = new AbortController();
      const url = `${API_URL}api/chat/sessions/${sessionId}/messages/${messageId}/edit/stream`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content, modelOverride }),
        signal: abortRef.current.signal,
      });
      if (!response.body) {
        dispatch(setIsStreaming(false));
        return;
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          while (buffer.includes("\n\n")) {
            const idx = buffer.indexOf("\n\n");
            const block = buffer.slice(0, idx);
            buffer = buffer.slice(idx + 2);
            let type = "message";
            let data: unknown = null;
            for (const line of block.split("\n")) {
              if (line.startsWith("event:")) type = line.slice(6).trim();
              if (line.startsWith("data:")) {
                try {
                  data = JSON.parse(line.slice(5).trim());
                } catch {
                  data = line.slice(5).trim();
                }
              }
            }
            switch (type) {
              case "token":
                setStreamingContent(
                  (prev) =>
                    prev +
                    (data && typeof data === "object" && "content" in data
                      ? decodeUnicodeEscapes(
                          String((data as { content: string }).content),
                        )
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
                if (
                  payload?.displayType === "questionnaire" &&
                  payload?.displayData
                ) {
                  const mapped = mapToolResultToQuestionnaire(
                    payload.displayData,
                  );
                  if (mapped && mapped.options.length > 0)
                    dispatch(
                      setChatQuestionnaire({
                        questionnaire: mapped,
                        sessionId,
                      }),
                    );
                }
                break;
              }
              case "questionnaire":
                dispatch(
                  setChatQuestionnaire({
                    questionnaire: (data as QuestionnaireData) ?? null,
                    sessionId,
                  }),
                );
                break;
              case "session_title":
                queryClient.setQueryData(
                  ["chat", "session", sessionId],
                  (prev: unknown) =>
                    prev && typeof prev === "object"
                      ? { ...prev, title: (data as { title: string })?.title }
                      : prev,
                );
                queryClient.invalidateQueries({
                  queryKey: ["chat", "sessions"],
                });
                break;
              case "error": {
                const errMsg =
                  data && typeof data === "object" && "message" in data
                    ? String((data as { message: string }).message)
                    : "Произошла ошибка";
                console.error("Chat stream error:", data);
                setStreamError(errMsg);
                break;
              }
              case "done":
                queryClient.invalidateQueries({
                  queryKey: ["chat", "messages", sessionId],
                });
                break;
              default:
                break;
            }
          }
        }
      } catch (err) {
        if ((err as Error)?.name !== "AbortError") throw err;
      } finally {
        dispatch(setIsStreaming(false));
        setStreamingContent("");
        setToolCalls([]);
      }
    },
    [sessionId, dispatch, queryClient],
  );

  const regenerateMessage = useCallback(
    async (messageId: string) => {
      if (!sessionId) return;
      dispatch(setIsStreaming(true));
      setStreamingContent("");
      setToolCalls([]);
      setStreamError(null);
      abortRef.current = new AbortController();
      const url = `${API_URL}api/chat/sessions/${sessionId}/messages/${messageId}/regenerate/stream`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
        signal: abortRef.current.signal,
      });
      if (!response.body) {
        dispatch(setIsStreaming(false));
        return;
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          while (buffer.includes("\n\n")) {
            const idx = buffer.indexOf("\n\n");
            const block = buffer.slice(0, idx);
            buffer = buffer.slice(idx + 2);
            let type = "message";
            let data: unknown = null;
            for (const line of block.split("\n")) {
              if (line.startsWith("event:")) type = line.slice(6).trim();
              if (line.startsWith("data:")) {
                try {
                  data = JSON.parse(line.slice(5).trim());
                } catch {
                  data = line.slice(5).trim();
                }
              }
            }
            switch (type) {
              case "token":
                setStreamingContent(
                  (prev) =>
                    prev +
                    (data && typeof data === "object" && "content" in data
                      ? decodeUnicodeEscapes(
                          String((data as { content: string }).content),
                        )
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
                if (
                  payload?.displayType === "questionnaire" &&
                  payload?.displayData
                ) {
                  const mapped = mapToolResultToQuestionnaire(
                    payload.displayData,
                  );
                  if (mapped && mapped.options.length > 0)
                    dispatch(
                      setChatQuestionnaire({
                        questionnaire: mapped,
                        sessionId,
                      }),
                    );
                }
                break;
              }
              case "questionnaire":
                dispatch(
                  setChatQuestionnaire({
                    questionnaire: (data as QuestionnaireData) ?? null,
                    sessionId,
                  }),
                );
                break;
              case "session_title":
                queryClient.setQueryData(
                  ["chat", "session", sessionId],
                  (prev: unknown) =>
                    prev && typeof prev === "object"
                      ? { ...prev, title: (data as { title: string })?.title }
                      : prev,
                );
                queryClient.invalidateQueries({
                  queryKey: ["chat", "sessions"],
                });
                break;
              case "error": {
                const errMsg =
                  data && typeof data === "object" && "message" in data
                    ? String((data as { message: string }).message)
                    : "Произошла ошибка";
                console.error("Chat stream error:", data);
                setStreamError(errMsg);
                break;
              }
              case "done":
                queryClient.invalidateQueries({
                  queryKey: ["chat", "messages", sessionId],
                });
                break;
              default:
                break;
            }
          }
        }
      } catch (err) {
        if ((err as Error)?.name !== "AbortError") throw err;
      } finally {
        dispatch(setIsStreaming(false));
        setStreamingContent("");
        setToolCalls([]);
      }
    },
    [sessionId, dispatch, queryClient],
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
