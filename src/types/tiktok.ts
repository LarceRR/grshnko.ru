export interface IChannelInfo {
  username?: string;
  url?: string;
  error?: string;
  fullUrl?: string;
  videoMeta?: IVideoMeta
  description?: string;
}

export interface IVideoMeta {
  duration?: number;   // длительность в секундах
  width?: number;      // ширина видео
  height?: number;     // высота видео
  bitrate?: number;    // битрейт
  codec?: string;      // кодек
  size?: number;       // размер файла (если знаешь заранее)
  thumbnail?: string;  // превью
}

export interface ITikTokTabProps {}

export interface ITikTokDownloadResult {
  data: string | null;
  isLoading: boolean;
  isError: boolean;
}