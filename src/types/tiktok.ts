export interface IChannelInfo {
  username?: string;
  channelUrl?: string;
  error?: string;
  fullUrl?: string;
}

export interface ITikTokTabProps {}

export interface ITikTokDownloadResult {
  data: string | null;
  isLoading: boolean;
  isError: boolean;
}