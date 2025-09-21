import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { API_URL } from "../config";

export const useTikTokDownload = (queryUrl: string) => {
  return useQuery({
    queryKey: ["download-tiktok", queryUrl],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}download-tiktok`, {
        params: { url: queryUrl, download: 1 },
        withCredentials: true,
      });
      // console.log(res)
      return res.data.videoUrl;
    },
    enabled: !!queryUrl,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};