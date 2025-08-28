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

  // Функция для безопасного парсинга заголовка
  const parseVideoHeader = (rawHeader: string): IChannelInfo | null => {
    try {
      // Пытаемся декодировать и распарсить
      const decoded = decodeURIComponent(rawHeader);
      const parsed = JSON.parse(decoded);
      return getChannelInfo(parsed);
    } catch (error) {
      console.error("Ошибка парсинга заголовка видео:", error);

      // Альтернативная попытка: если это уже объект, а не строка
      try {
        if (typeof rawHeader === "object") {
          return getChannelInfo(rawHeader);
        }

        // Пытаемся очистить строку от лишних символов
        const cleaned = rawHeader.replace(/^%+/, "").replace(/%+$/, "");
        const decoded = decodeURIComponent(cleaned);
        const parsed = JSON.parse(decoded);
        return getChannelInfo(parsed);
      } catch (secondError) {
        console.error("Вторая попытка парсинга также не удалась:", secondError);
        return null;
      }
    }
  };

  // После загрузки видео добавляем его в массив
  useEffect(() => {
    if (!isLoading && !isError && queryUrl && data?.res?.headers) {
      const rawHeader = data.res.headers["x-video-url"];

      if (!rawHeader) {
        console.error("Заголовок X-Video-Url отсутствует в ответе");
        return;
      }

      const info = parseVideoHeader(rawHeader);

      if (!info) {
        console.error("Не удалось распарсить информацию о видео");
        return;
      }

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
  }, [isLoading, isError, queryUrl, data, selectedVideos, dispatch]);

  const handleDownload = () => {
    if (videoUrl.trim()) setQueryUrl(videoUrl.trim());
  };

  const handleRemoveVideo = (fullUrl: string) => {
    dispatch(
      setSelectedVideos(selectedVideos.filter((v) => v.fullUrl !== fullUrl))
    );
  };

  const handleVideoMeta = (
    fullUrl: string,
    meta: { duration: number; width: number; height: number }
  ) => {
    const updated = selectedVideos.map((v) =>
      v.fullUrl === fullUrl ? { ...v, videoMeta: meta } : v
    );
    dispatch(setSelectedVideos(updated));
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
              <TikTokVideoPlayer
                videoUrl={selectedVideos[0].fullUrl!}
                onMeta={(meta) =>
                  handleVideoMeta(selectedVideos[0].fullUrl!, meta)
                }
              />
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
                    <TikTokVideoPlayer
                      videoUrl={video.fullUrl!}
                      onMeta={(meta) => handleVideoMeta(video.fullUrl!, meta)}
                    />
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
