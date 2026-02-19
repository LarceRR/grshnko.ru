// hooks/useOtaProgress.ts — SSE-based OTA progress tracking
import { useState, useEffect, useCallback, useRef } from "react";
import { API_URL } from "../config";

export type OtaStatus =
  | "idle"
  | "downloading"
  | "verifying"
  | "flashing"
  | "rebooting"
  | "complete"
  | "failed";

export interface OtaProgress {
  status: OtaStatus;
  percent: number;
  error?: string;
  errorCode?: string;
}

/**
 * Subscribe to real-time OTA events for a device via SSE.
 * Call `start(deviceMongoId)` after triggering OTA.
 * Call `reset()` to clear state.
 */
export function useOtaProgress() {
  const [progress, setProgress] = useState<OtaProgress>({
    status: "idle",
    percent: 0,
  });
  const [active, setActive] = useState(false);
  const esRef = useRef<EventSource | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanup = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    cleanup();
    setActive(false);
    setProgress({ status: "idle", percent: 0 });
  }, [cleanup]);

  const start = useCallback(
    (deviceId: string) => {
      cleanup();
      setActive(true);
      setProgress({ status: "downloading", percent: 0 });

      const url = `${API_URL}api/ota/events/${deviceId}`;
      const es = new EventSource(url, { withCredentials: true });
      esRef.current = es;

      // Timeout: if no events for 3 minutes, assume failure
      const resetTimeout = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          setProgress((p) => ({
            ...p,
            status: "failed",
            error: "Timeout: no response from device",
          }));
          setActive(false);
          es.close();
        }, 180000);
      };
      resetTimeout();

      es.onmessage = (event) => {
        resetTimeout();
        try {
          const data = JSON.parse(event.data);
          const type: string = data.type;

          if (type === "ota.progress") {
            const status = (data.status as OtaStatus) || "downloading";
            const percent = typeof data.percent === "number" ? data.percent : 0;
            setProgress({ status, percent });
          } else if (type === "ota.failed") {
            setProgress({
              status: "failed",
              percent: 0,
              error: data.message || "OTA update failed",
              errorCode: data.code,
            });
            setActive(false);
            es.close();
          } else if (type === "ota.error_report") {
            setProgress({
              status: "failed",
              percent: 0,
              error: data.message || "OTA error",
              errorCode: data.code,
            });
            setActive(false);
            es.close();
          } else if (type === "device.offline") {
            // Device went offline — likely rebooting after flash
            setProgress({ status: "rebooting", percent: 100 });
          } else if (type === "device.online") {
            // Device is back online — OTA complete
            setProgress({ status: "complete", percent: 100 });
            setActive(false);
            es.close();
          }
        } catch {
          // Ignore parse errors (keep-alive comments, etc.)
        }
      };

      es.onerror = () => {
        // EventSource will auto-reconnect; only mark failed if closed
        if (es.readyState === EventSource.CLOSED) {
          setProgress((prev) =>
            prev.status === "complete" || prev.status === "failed"
              ? prev
              : {
                  ...prev,
                  status: "failed",
                  error: "Connection to server lost",
                },
          );
          setActive(false);
        }
      };
    },
    [cleanup],
  );

  // Cleanup on unmount
  useEffect(() => cleanup, [cleanup]);

  return { progress, active, start, reset };
}
