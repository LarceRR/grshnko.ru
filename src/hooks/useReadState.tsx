import { useEffect, useRef, useCallback } from "react";
import { chatApi } from "../api/chat";
import type { ChatMessage } from "../types/chat.types";

interface UseReadStateOptions {
  sessionId: string | null;
  messages: ChatMessage[];
  lastReadSequenceNumber: number;
  containerRef: React.RefObject<HTMLElement | null>;
  enabled?: boolean;
}

const DEBOUNCE_MS = 800;

/**
 * Tracks which messages are visible via IntersectionObserver,
 * debounces PATCH calls to mark them as read, and provides
 * a ref to the first unread message for scroll-to behaviour.
 */
export function useReadState({
  sessionId,
  messages,
  lastReadSequenceNumber,
  containerRef,
  enabled = true,
}: UseReadStateOptions) {
  const maxVisibleSeqRef = useRef(lastReadSequenceNumber);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sentSeqRef = useRef(lastReadSequenceNumber);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    maxVisibleSeqRef.current = lastReadSequenceNumber;
    sentSeqRef.current = lastReadSequenceNumber;
  }, [lastReadSequenceNumber]);

  const flush = useCallback(() => {
    if (!sessionId) return;
    const seq = maxVisibleSeqRef.current;
    if (seq <= sentSeqRef.current) return;
    sentSeqRef.current = seq;
    chatApi.markAsRead(sessionId, seq).catch(() => {});
  }, [sessionId]);

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        let changed = false;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const seq = Number(
            (entry.target as HTMLElement).dataset.sequenceNumber,
          );
          if (!Number.isNaN(seq) && seq > maxVisibleSeqRef.current) {
            maxVisibleSeqRef.current = seq;
            changed = true;
          }
        }
        if (changed) {
          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(flush, DEBOUNCE_MS);
        }
      },
      { root: containerRef.current, threshold: 0.5 },
    );

    const container = containerRef.current;
    const elements = container.querySelectorAll("[data-sequence-number]");
    elements.forEach((el) => observerRef.current!.observe(el));

    return () => {
      observerRef.current?.disconnect();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        flush();
      }
    };
  }, [enabled, containerRef, messages, flush]);

  const scrollToFirstUnread = useCallback(() => {
    if (!containerRef.current || lastReadSequenceNumber <= 0) return;

    const firstUnread = containerRef.current.querySelector(
      `[data-sequence-number="${lastReadSequenceNumber + 1}"]`,
    ) as HTMLElement | null;

    if (firstUnread) {
      firstUnread.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const allEls = containerRef.current.querySelectorAll(
      "[data-sequence-number]",
    );
    for (const el of allEls) {
      const seq = Number((el as HTMLElement).dataset.sequenceNumber);
      if (seq > lastReadSequenceNumber) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
    }
  }, [containerRef, lastReadSequenceNumber]);

  const markLatestAsRead = useCallback(
    (seq: number) => {
      if (seq > maxVisibleSeqRef.current) {
        maxVisibleSeqRef.current = seq;
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(flush, DEBOUNCE_MS);
      }
    },
    [flush],
  );

  return { scrollToFirstUnread, markLatestAsRead };
}
