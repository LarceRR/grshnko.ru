import React from "react";
import { IChannelInfo } from "../../../../../types/tiktok";
import InfoString from "../../InfoString/InfoString";
import DecodeText from "../../DecodeText/DecodeText";

interface ChannelInfoProps {
  channelInfo: IChannelInfo | null;
}

export const ChannelInfo: React.FC<ChannelInfoProps> = ({ channelInfo }) => {
  if (!channelInfo) return null;

  const { url, fullUrl, videoMeta, description } = channelInfo;
  console.log(channelInfo);

  return (
    <div className="channel-info__wrapper">
      {/* <InfoString label="Имя пользователя в тиктоке" information={username} /> */}
      <InfoString label="Ссылка на источник (тикток)" information={url} />
      <InfoString label="Прямая ссылка на видео" information={fullUrl} />

      {videoMeta && (
        <>
          <InfoString
            label="Длительность видео (сек)"
            information={
              videoMeta.duration
                ? Math.round(videoMeta.duration).toString()
                : "—"
            }
          />
          <InfoString
            label="Разрешение"
            information={
              videoMeta.width && videoMeta.height
                ? `${videoMeta.width}x${videoMeta.height}`
                : "—"
            }
          />
        </>
      )}
      <InfoString
        label="Описание"
        information={<DecodeText text={description || ""} />}
      />
    </div>
  );
};
