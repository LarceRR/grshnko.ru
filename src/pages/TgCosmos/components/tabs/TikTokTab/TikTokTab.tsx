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
import SelectableBadge from "../../SelectableBadge/SelectableBadge";
import { useAppDispatch, useAppSelector } from "../../../../../store/hooks";
import { setVideo } from "../../../../../features/currentVideoSlice";
export const TikTokTab: React.FC = () => {
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [queryUrl, setQueryUrl] = useState<string>("");
  const dispatch = useAppDispatch();
  const currentVideo = useAppSelector((state) => state.currentVideo.video);
  const [channelInfo, setChannelInfo] = useState<IChannelInfo | null>(
    currentVideo
  );
  const { data, isLoading, isError } = useTikTokDownload(queryUrl);
  useEffect(() => {
    if (!queryUrl) setChannelInfo(null);
  }, [queryUrl]);
  useEffect(() => {
    if (!isLoading && !isError && queryUrl) {
      setChannelInfo(
        getChannelInfo(JSON.parse(data?.res.headers["x-video-url"]))
      );
    }
  }, [isLoading, isError, queryUrl]);
  const handleDownload = () => {
    if (videoUrl.trim()) setQueryUrl(videoUrl.trim());
  };
  const handleToggleVideo = () => {
    if (!channelInfo) return;
    const isSelected =
      currentVideo &&
      JSON.stringify(currentVideo) === JSON.stringify(channelInfo);
    dispatch(setVideo(isSelected ? {} : channelInfo));
  };
  const isSelected =
    currentVideo &&
    channelInfo &&
    JSON.stringify(currentVideo) === JSON.stringify(channelInfo);
  return (
    <div className="tiktok">
      {" "}
      <div className="tiktok__inner-wrapper">
        {" "}
        <div className="tiktok__inner-wrapper__withDescription">
          {" "}
          <TikTokUrlInput
            videoUrl={videoUrl}
            isLoading={isLoading}
            onUrlChange={setVideoUrl}
            onDownload={handleDownload}
            placeholder="Введите ссылку на тикток видео"
          />{" "}
        </div>{" "}
        <div className="tiktok-video-wrapper">
          {" "}
          {data?.data && (
            <div className="tiktok-video-wrapper__video">
              {" "}
              <TikTokVideoPlayer videoUrl={data?.data} />{" "}
              <SelectableBadge
                selected={!!isSelected}
                onClick={handleToggleVideo}
              />{" "}
            </div>
          )}{" "}
          <StatusMessage
            isLoading={isLoading}
            isError={isError}
            hasQueryUrl={!!queryUrl}
            channelInfo={channelInfo}
          />{" "}
          {!isLoading && !isError && channelInfo && (
            <ChannelInfo channelInfo={channelInfo} />
          )}{" "}
        </div>{" "}
      </div>{" "}
    </div>
  );
};
