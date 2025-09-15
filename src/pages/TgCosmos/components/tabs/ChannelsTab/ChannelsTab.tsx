import React, { useMemo, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import CircleImage from "../../../../../components/CircleImage/CircleImage";
import { Skeleton, Button } from "antd";
import { Pin } from "lucide-react";
import "./ChannelsTab.scss";
import { TelegramChannel } from "../../../../../types/telegram-channel";
import { API_URL } from "../../../../../config";

interface IChannelsTabProps {
  onClick: (channel: TelegramChannel) => void;
  loadOnlyMyChannels?: boolean;
  selectedChannel?: TelegramChannel;
}

export const ChannelsTab: React.FC<IChannelsTabProps> = ({
  onClick,
  loadOnlyMyChannels,
  selectedChannel,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery<{ channels: TelegramChannel[] }, Error>({
    queryKey: ["channels", loadOnlyMyChannels],
    queryFn: async ({ pageParam }) => {
      const lastChannelId = (pageParam as string) || "";

      const queryParams = new URLSearchParams({
        myOnly: String(loadOnlyMyChannels),
        lastChannel: lastChannelId,
      });

      const res = await fetch(`${API_URL}getAllChannels?${queryParams}`, {
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to fetch channels");
      return res.json();
    },
    refetchOnWindowFocus: false,
    getNextPageParam: (lastPage) => {
      if (!lastPage.channels || lastPage.channels.length === 0)
        return undefined;
      const lastChannel = lastPage.channels[lastPage.channels.length - 1];
      return lastChannel.id || undefined;
    },
    initialPageParam: "" as string,
  });

  const allChannels = useMemo(() => {
    const seen = new Set<string>();
    return (
      data?.pages
        .flatMap((page) => page.channels || [])
        .filter((ch) => {
          if (seen.has(ch.id)) return false;
          seen.add(ch.id);
          return true;
        }) || []
    );
  }, [data]);

  const sortedChannels = useMemo(() => {
    return [...allChannels].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return 0;
    });
  }, [allChannels]);

  if (error) return <div>Ошибка загрузки</div>;

  return (
    <div
      className="channels-list__wrapper"
      ref={containerRef}
      style={{ maxHeight: "500px", overflow: "auto", marginTop: 30 }}
    >
      {isLoading && sortedChannels.length === 0 ? (
        <div className="channels-list">
          {Array.from({ length: 10 }).map((_, idx) => (
            <Skeleton.Avatar
              key={idx}
              active
              size={50}
              shape="circle"
              style={{ marginRight: 10, marginBottom: 10 }}
            />
          ))}
        </div>
      ) : sortedChannels.length > 0 ? (
        <>
          <div className="channels-list">
            {sortedChannels.map((channel: TelegramChannel, i: number) => (
              <CircleImage
                key={i}
                src={channel.avatar}
                alt={channel.title}
                size={50}
                children={
                  channel.isPinned && (
                    <Pin
                      size={16}
                      style={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        opacity: 0.5,
                      }}
                    />
                  )
                }
                imageStyle={{
                  outline:
                    selectedChannel?.id === channel.id
                      ? "3px solid var(--input-focus)"
                      : undefined,
                }}
                text={channel.title}
                textStyle={{
                  color:
                    selectedChannel?.id === channel.id
                      ? "var(--text-color)"
                      : "gray",
                }}
                className={
                  channel.isPinned ? "channel-item isPinned" : "channel-item"
                }
                onClick={() => onClick(channel)}
              />
            ))}
          </div>

          {hasNextPage && (
            <div
              style={{ display: "flex", justifyContent: "center", padding: 20 }}
            >
              <Button
                type="primary"
                loading={isFetchingNextPage}
                onClick={() => fetchNextPage()}
              >
                Показать ещё
              </Button>
            </div>
          )}
        </>
      ) : (
        <div style={{ padding: "20px", textAlign: "center", color: "gray" }}>
          Нет доступных каналов
        </div>
      )}
    </div>
  );
};

export default ChannelsTab;
