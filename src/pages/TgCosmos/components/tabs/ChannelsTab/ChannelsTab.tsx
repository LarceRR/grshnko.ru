import React, { useMemo, useRef, useEffect } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { useInfiniteQuery } from "@tanstack/react-query";
import CircleImage from "../../../../../components/CircleImage/CircleImage";
import { Skeleton } from "antd";
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
    getNextPageParam: (lastPage) => {
      if (!lastPage.channels || lastPage.channels.length === 0) {
        return undefined;
      }

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

  // Debug scroll events (optional, remove after confirming fix)
  useEffect(() => {
    const handleScroll = () => {
      // console.log("Wrapper scrolled!");
      // Optional: Log when near bottom
      const wrapper = containerRef.current;
      if (wrapper) {
        const { scrollTop, scrollHeight, clientHeight } = wrapper;
        if (scrollTop + clientHeight >= scrollHeight - 100) {
          // console.log("Near bottom, should trigger fetchNextPage!");
        }
      }
    };

    const wrapper = containerRef.current;
    if (wrapper) {
      wrapper.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (wrapper) {
        wrapper.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  if (error) return <div>Ошибка загрузки</div>;

  return (
    <div
      className="channels-list__wrapper"
      id="channels-list__wrapper"
      ref={containerRef}
      style={{ height: "500px", overflow: "auto", marginTop: 30 }} // Adjusted height for modal
    >
      {isLoading && sortedChannels.length <= 0 ? (
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
        <InfiniteScroll
          dataLength={sortedChannels.length}
          next={fetchNextPage}
          hasMore={!!hasNextPage && !isFetchingNextPage}
          loader={
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "20px",
              }}
            ></div>
          }
          scrollableTarget="channels-list__wrapper"
          endMessage={
            <p style={{ textAlign: "center", padding: "20px" }}>Загрузка...</p>
          }
        >
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
                  channel.isPinned ? "channel-item isPinned" : "channel-item "
                }
                onClick={() => onClick(channel)}
              />
            ))}
          </div>
        </InfiniteScroll>
      ) : (
        <div style={{ padding: "20px", textAlign: "center", color: "gray" }}>
          Нет доступных каналов
        </div>
      )}
    </div>
  );
};

export default ChannelsTab;
