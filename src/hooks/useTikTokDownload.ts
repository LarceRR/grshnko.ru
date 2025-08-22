import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export const useTikTokDownload = (queryUrl: string) => {
  return useQuery({
    queryKey: ["download-tiktok", queryUrl],
    queryFn: async () => {
      const res = await axios.get("https://api.grshnko.ru/download-tiktok", {
        params: { url: queryUrl, download: 1 },
        responseType: "blob",
      });
      console.log(res)
      return {
        data: URL.createObjectURL(res.data),
        res: res,
      };
    },
    enabled: !!queryUrl,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};