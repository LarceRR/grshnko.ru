import { useQuery } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import CircleImage from "../../../../../components/CircleImage/CircleImage";
import "./ChannelsTab.scss";
import { Skeleton } from "antd";
import { Message } from "../../../../../types/postTypes";

interface IChannelsTabProps {}

const ChannelsTab: React.FC<IChannelsTabProps> = (props) => {
  const {
    data: channels,
    isLoading: isChannelsLoading,
    error,
  } = useQuery({
    queryKey: ["getAllChannels"], // уникальный ключ запроса
    queryFn: () =>
      fetch(`${import.meta.env.VITE_API_URL}getAllChannels`).then((res) =>
        res.json()
      ),
  });

  const [channelId, setChannelId] = useState(
    channels?.channels[0]?.id || "@saycosmos"
  );

  const {
    data: messages,
    isLoading: isMessagesLoading,
    error: messagesError,
  } = useQuery({
    queryKey: ["getAllMessagesFromChannelId", channelId],
    queryFn: () =>
      fetch(
        `${import.meta.env.VITE_API_URL}getAllMessages?channel=${channelId}`
      ).then((res) => res.json()),
    enabled: !!channelId, // запускаем только если filter не пустой
  });

  useEffect(() => {
    console.log(messages);
  }, [messages]);

  if (isChannelsLoading)
    return (
      <Skeleton.Avatar
        active={true}
        size={"large"}
        shape="square"
        style={{
          height: "70px",
          width: "650px",
          borderRadius: 5,
        }}
      />
    );
  if (error) return <div>Ошибка загрузки</div>;

  return (
    <div style={{ width: "100%", maxWidth: "629px" }}>
      {channels && channels.channels.length > 0 ? (
        <>
          <div className="channels-list">
            {channels.channels.map((channel: any) => (
              <CircleImage
                key={channel.id}
                src={channel.avatar}
                alt={channel.title}
                size={50}
                text={channel.title}
                textColor="#000"
                onClick={() => {
                  setChannelId(`${channel.id}`);
                  console.log(channel);
                }}
              />
            ))}
          </div>
          <div>
            {!isMessagesLoading && messages && (
              <div className="messages-list">
                {messages.messages.map((message: Message) => (
                  <span key={message.id}>
                    {message.message}
                    <br></br>
                  </span>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div>Нет доступных каналов</div>
      )}
    </div>
  );
};

export default ChannelsTab;
