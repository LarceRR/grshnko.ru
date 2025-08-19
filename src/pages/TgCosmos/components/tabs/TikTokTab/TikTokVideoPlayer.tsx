import React from "react";

interface TikTokVideoPlayerProps {
  videoUrl: string | null;
}

export const TikTokVideoPlayer: React.FC<TikTokVideoPlayerProps> = ({
  videoUrl,
}) => {
  if (!videoUrl) return null;

  return <video src={videoUrl} controls />;
};
