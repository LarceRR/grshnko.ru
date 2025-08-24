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
import { setSelectedVideos } from "../../../../../features/currentVideoSlice";

import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/swiper-bundle.css";

export const TikTokTab: React.FC = () => {
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [queryUrl, setQueryUrl] = useState<string>("");
  const dispatch = useAppDispatch();
  const selectedVideos = useAppSelector(
    (state) => state.currentVideo.selectedVideos
  );
  const [currentDownload, setCurrentDownload] = useState<IChannelInfo | null>(
    null
  );
  const { data, isLoading, isError } = useTikTokDownload(queryUrl);

  // Сброс текущего видео при изменении ссылки
  useEffect(() => {
    if (!queryUrl) setCurrentDownload(null);
  }, [queryUrl]);

  // После загрузки видео добавляем его в массив
  useEffect(() => {
    if (!isLoading && !isError && queryUrl && data?.res?.headers) {
      const info = getChannelInfo(JSON.parse(data.res.headers["x-video-url"]));
      setCurrentDownload(info);

      // Проверяем, есть ли уже видео с таким fullUrl
      const exists = selectedVideos.some((v) => v.fullUrl === info.fullUrl);
      if (!exists) {
        dispatch(setSelectedVideos([...selectedVideos, info]));
      }

      // Сбрасываем инпут и запрос
      setVideoUrl("");
      setQueryUrl("");
    }
  }, [isLoading, isError, queryUrl, data]);

  const handleDownload = () => {
    if (videoUrl.trim()) setQueryUrl(videoUrl.trim());
  };

  const handleRemoveVideo = (fullUrl: string) => {
    dispatch(
      setSelectedVideos(selectedVideos.filter((v) => v.fullUrl !== fullUrl))
    );
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
          {/* Одно видео */}
          {selectedVideos.length === 1 && (
            <div className="tiktok-video-wrapper__video">
              <TikTokVideoPlayer videoUrl={selectedVideos[0].fullUrl!} />
              <SelectableBadge
                selected={true}
                onClick={() => handleRemoveVideo(selectedVideos[0].fullUrl!)}
              />
              <ChannelInfo channelInfo={selectedVideos[0]} />
            </div>
          )}

          {/* Слайдер если видео больше одного */}
          {selectedVideos.length > 1 && (
            <Swiper spaceBetween={10} slidesPerView={1}>
              {selectedVideos.map((video) => (
                <SwiperSlide key={video.fullUrl}>
                  <div className="tiktok-video-wrapper__video">
                    <TikTokVideoPlayer videoUrl={video.fullUrl!} />
                    <SelectableBadge
                      selected={true}
                      onClick={() => handleRemoveVideo(video.fullUrl!)}
                    />
                    <ChannelInfo channelInfo={video} />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          )}

          {/* Статус загрузки */}
          {selectedVideos.length === 0 && (
            <StatusMessage
              isLoading={isLoading}
              isError={isError}
              hasQueryUrl={!!queryUrl}
              channelInfo={currentDownload}
            />
          )}
        </div>
      </div>
    </div>
  );
};
