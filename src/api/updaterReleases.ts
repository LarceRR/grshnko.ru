import axios from "axios";
import { API_URL } from "../config";
import type { UpdaterReleaseList } from "../types/updaterRelease";

const withAuth = { withCredentials: true };

export const getUpdaterReleases = async (): Promise<UpdaterReleaseList> => {
  const res = await axios.get<UpdaterReleaseList>(`${API_URL}api/updater-releases`, {
    ...withAuth,
  });
  return res.data;
};
