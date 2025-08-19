import React from "react";
import { IChannelInfo } from "../../../../../types/tiktok";
import InfoString from "../../InfoString/InfoString";

interface ChannelInfoProps {
  channelInfo: IChannelInfo | null;
}

export const ChannelInfo: React.FC<ChannelInfoProps> = ({ channelInfo }) => {
  if (!channelInfo) return null;

  return (
    <div className="channel-info__wrapper">
      <InfoString
        label="Имя пользователя в тиктоке"
        information={channelInfo.username}
      />
      <InfoString
        label="Ссылка на источник (тикток)"
        information={channelInfo.channelUrl}
      />
    </div>
  );
};
