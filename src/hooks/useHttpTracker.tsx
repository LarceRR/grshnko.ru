// hooks/useHttpTracker.ts
import { useState, useEffect } from "react";
import { addHttpListener, TrackedRequest } from "../utils/fetchInterceptor";

export const useHttpTracker = () => {
  const [requests, setRequests] = useState<TrackedRequest[]>([]);

  useEffect(() => {
    const unsubscribe = addHttpListener((request) => {
      setRequests((prev) => {
        // обновляем существующий или добавляем новый
        const index = prev.findIndex((r) => r.id === request.id);
        if (index > -1) {
          const copy = [...prev];
          copy[index] = request;
          return copy;
        }
        return [...prev, request];
      });
    });

    return () => unsubscribe();
  }, []);

  return requests;
};
