import axios from "axios";
import { API_URL } from "../config";

export interface UserActivity {
  pageVisits: Record<string, number>;
  startupPage: string | null;
  mostVisitedPage: string | null;
}

export interface UserPreferences {
  startupPage?: string | null;
}

/**
 * Sends a page-visit event to the backend.
 * Fire-and-forget — errors are silently ignored.
 */
export const trackPageVisit = (path: string): void => {
  axios
    .post(
      `${API_URL}api/activity/page-visit`,
      { path },
      { withCredentials: true }
    )
    .catch(() => {
      // Non-critical — never interrupt UX
    });
};

/**
 * Returns the current user's activity data, including startupPage and mostVisitedPage.
 */
export const getMyActivity = async (): Promise<UserActivity> => {
  const res = await axios.get<UserActivity>(`${API_URL}api/activity/me`, {
    withCredentials: true,
  });
  return res.data;
};

/**
 * Saves user preferences (e.g. startup page).
 * Pass startupPage: null to reset to default.
 */
export const updatePreferences = async (
  prefs: UserPreferences
): Promise<void> => {
  await axios.patch(`${API_URL}api/activity/preferences`, prefs, {
    withCredentials: true,
  });
};
