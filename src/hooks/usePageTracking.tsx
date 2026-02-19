import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageVisit } from "../api/activity";

/**
 * Strips dynamic segments (MongoDB ObjectIds, UUIDs) from a path
 * so that e.g. "/devices/507f1f77bcf86cd799439011" becomes "/devices".
 */
function normalizePath(pathname: string): string {
  return pathname
    .split("/")
    .filter(
      (segment) =>
        // remove 24-char hex ObjectIds
        !/^[0-9a-f]{24}$/i.test(segment) &&
        // remove UUIDs
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          segment
        )
    )
    .join("/") || "/";
}

/**
 * Tracks page visits on every route change.
 * Must be used inside a component that is a descendant of <BrowserRouter>.
 * Only fires when the user is authenticated (silently skips on 401).
 */
export function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    const normalized = normalizePath(location.pathname);
    trackPageVisit(normalized);
  }, [location.pathname]);
}
