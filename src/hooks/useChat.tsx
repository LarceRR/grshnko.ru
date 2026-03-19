import { useState, useRef, useCallback, useEffect } from "react";
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
  const [pendingMessage, setPendingMessage] = useState<{
    clientId: string;
    content: string;
    createdAtMs: number;
  } | null>(null);
  const [streamError, setStreamError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  // Cleanup abort controller on unmount or sessionId change
  useEffect(() => {
    return () => {
      if (abortRef.current && !abortRef.current.signal.aborted) {
        abortRef.current.abort();
      }
    };
  }, []);

  const executeStream = useCallback(
    async (
      url: string,
      body: object,
      initialUserMessage: string | null = null,
    ) => {
      if (!sessionId) return;
      let streamEndedWithDone = false;

      dispatch(setIsStreaming(true));
      if (initialUserMessage) {
        const clientId =
          ((body as Record<string, unknown>).clientId as string) ?? "";
        setPendingMessage({
          clientId,
          content: initialUserMessage,
          createdAtMs: Date.now(),
        });
      } else {
        setPendingMessage(null);
      }
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
                } catch (parseError) {
                  // Log parsing errors for debugging but continue processing
                  console.warn(
                    `Failed to parse SSE data: ${dataStr.slice(0, 100)}`,
                    parseError,
                  );
                  data = { raw: dataStr };
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
              case "session_title": {
                const title = (data as { title?: string })?.title;
                queryClient.setQueryData(
                  ["chat", "session", sessionId],
                  (prev: unknown) =>
                    prev && typeof prev === "object"
                      ? { ...prev, title }
                      : prev,
                );
                // Обновляем кэш списка сессий без нового запроса
                queryClient.setQueriesData(
                  { queryKey: ["chat", "sessions"] },
                  (prev: unknown) => {
                    if (
                      !prev ||
                      typeof prev !== "object" ||
                      !("data" in prev) ||
                      !Array.isArray((prev as { data: unknown }).data)
                    )
                      return prev;
                    const list = prev as {
                      data: { id: string; title: string | null }[];
                    };
                    return {
                      ...list,
                      data: list.data.map((s) =>
                        s.id === sessionId
                          ? { ...s, title: title ?? s.title }
                          : s,
                      ),
                    };
                  },
                );
                break;
              }
              case "error": {
                const errMsg =
                  data && typeof data === "object" && "message" in data
                    ? String((data as { message: string }).message)
                    : "Произошла ошибка";
                setStreamError(errMsg);
                break;
              }
              case "done":
                streamEndedWithDone = true;
                // Refetch and clear pending only after new list is in place so the same
                // React key (clientId) keeps the row — no remount, no re-animation
                void queryClient
                  .refetchQueries({ queryKey: ["chat", "messages", sessionId] })
                  .then(() => setPendingMessage(null));
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
        if (!streamEndedWithDone) {
          setPendingMessage(null);
        }
        setStreamingContent("");
        setToolCalls([]);
      }
    },
    [sessionId, dispatch, queryClient],
  );

  const sendMessage = useCallback(
    (
      content: string,
      modelOverride?: string,
      questionnaireResult?: {
        callId: string;
        assistantMessageId: string;
        submittedText: string;
      },
    ) => {
      const clientId = crypto.randomUUID();
      const url = `${API_URL}api/chat/sessions/${sessionId}/messages/stream`;
      const body: Record<string, unknown> = {
        content,
        modelOverride,
        clientId,
      };
      if (questionnaireResult)
        body.questionnaireResult = {
          callId: questionnaireResult.callId,
          assistantMessageId: questionnaireResult.assistantMessageId,
          submittedText: questionnaireResult.submittedText,
        };
      return executeStream(url, body, content);
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
    pendingMessage,
    streamError,
    clearStreamError,
  };
}
