// TikTokVideoPlayer.tsx
import React from "react";

interface TikTokVideoPlayerProps {
  videoUrl: string | null;
  onMeta?: (meta: { duration: number; width: number; height: number }) => void;
}

export const TikTokVideoPlayer: React.FC<TikTokVideoPlayerProps> = ({
  videoUrl,
  onMeta,
}) => {
  if (!videoUrl) return null;

  const handleLoadedMetadata = (
    e: React.SyntheticEvent<HTMLVideoElement, Event>
  ) => {
    const video = e.currentTarget;
    if (onMeta) {
      onMeta({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
      });
    }
  };

  return (
    <video src={videoUrl} controls onLoadedMetadata={handleLoadedMetadata} />
  );
};
