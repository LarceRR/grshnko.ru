import React, { useState, useEffect } from "react";
import "./TikTokTab.scss";
import { IChannelInfo } from "../../../../../types/tiktok";
import { useTikTokDownload } from "../../../../../hooks/useTikTokDownload";
import { getChannelInfo } from "../../../../../utils/tiktokUrlParser.util";
import {
  ChannelInfo,
  StatusMessage,
  TikTokUrlInput,
  TikTokVideoPlayer,
} from ".";

export const TikTokTab: React.FC = () => {
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [queryUrl, setQueryUrl] = useState<string>("");
  const [channelInfo, setChannelInfo] = useState<IChannelInfo | null>(null);

  const { data, isLoading, isError } = useTikTokDownload(queryUrl);

  useEffect(() => {
    if (!queryUrl) {
      setChannelInfo(null);
    }
  }, [queryUrl]);

  useEffect(() => {
    if (!isLoading && !isError && queryUrl) {
      setChannelInfo(getChannelInfo(queryUrl));
    }
  }, [isLoading, isError, queryUrl]);

  const handleDownload = () => {
    if (videoUrl.trim()) {
      setQueryUrl(videoUrl.trim());
    }
  };

  return (
    <div className="tiktok">
      <div className="tiktok__inner-wrapper">
        <div className="tiktok__inner-wrapper__withDescription">
          <TikTokUrlInput
            videoUrl={videoUrl}
            isLoading={isLoading}
            onUrlChange={setVideoUrl}
            onDownload={handleDownload}
            placeholder="Введите ссылку на тикток видео"
          />
        </div>

        <div className="tiktok-video-wrapper">
          <TikTokVideoPlayer videoUrl={data || null} />

          <StatusMessage
            isLoading={isLoading}
            isError={isError}
            hasQueryUrl={!!queryUrl}
            channelInfo={channelInfo}
          />

          {!isLoading && !isError && channelInfo && (
            <ChannelInfo channelInfo={channelInfo} />
          )}
        </div>
      </div>
    </div>
  );
};
