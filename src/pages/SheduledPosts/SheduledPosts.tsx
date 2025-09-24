// pages/SheduledPosts/SheduledPosts.tsx
import { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getScheduledPosts,
  deleteScheduledPost,
  updateScheduledPost,
} from "../../api/sheduledPosts";
import { ScheduledPost, STATUS_MAP } from "../../types/sheduledPost";
import {
  ColumnDef,
  flexRender,
  useReactTable,
  getCoreRowModel,
} from "@tanstack/react-table";
import "./SheduledPosts.scss";
import PostActions from "./PostActions";
import EditPostModal from "./EditPostModal/EditPostModal";
import { API_URL } from "../../config";
import { User } from "../../types/user";
import { getUser } from "../../api/user";
import { useNavigate } from "react-router";
import TableText from "./TableText";
import { useNotify } from "../../hooks/useNotify";
import TableMedia from "./TableMedia/TableMedia";
import debounce from "lodash.debounce";
import SheduledPostFilter from "./SheduledPostsFilter";
import { Popover } from "antd";

const SheduledPosts = ({ userId }: { userId?: string }) => {
  const queryClient = useQueryClient();
  const { data: user } = useQuery<User | null>({
    queryKey: ["user"],
    queryFn: () => getUser(),
  });

  const {
    data: posts = [],
    isLoading,
    isError,
  } = useQuery<ScheduledPost[]>({
    queryKey: ["getScheduledPosts", userId],
    queryFn: () => getScheduledPosts(userId),
    retry: false,
  });

  const navigate = useNavigate();
  const [editingPost, setEditingPost] = useState<ScheduledPost | null>(null);
  const { notify, contextHolder } = useNotify();
  const [filteredPosts, setFilteredPosts] = useState<ScheduledPost[]>([]);

  // --- Дебаунс для фильтрации текста ---
  const handleFilterDebounced = useMemo(
    () =>
      debounce((posts: ScheduledPost[]) => {
        setFilteredPosts(posts);
      }, 200),
    []
  );

  useEffect(() => {
    return () => {
      handleFilterDebounced.cancel();
    };
  }, [handleFilterDebounced]);

  const columns = useMemo<ColumnDef<ScheduledPost>[]>(
    () => [
      {
        header: "Текст",
        accessorKey: "text",
        cell: ({ getValue }) => {
          const text = getValue<string>();
          return <TableText text={text} />;
        },
      },
      {
        header: "Медиа",
        accessorFn: (row) => ({ photos: row.photos, videos: row.videos }),
        cell: ({ row }) => {
          const { photos, ScheduledVideo } = row.original;
          console.log(ScheduledVideo);
          return <TableMedia photos={photos} videos={ScheduledVideo} />;
        },
      },
      { header: "Канал", accessorKey: "chatId" },
      {
        header: "Дата публикации",
        accessorKey: "timestamp",
        cell: (info) => new Date(info.getValue() as string).toLocaleString(),
      },
      {
        header: "Пользователь",
        accessorKey: "user",
        cell: ({ getValue }) => {
          const sheduledPostUser = getValue<ScheduledPost["user"]>();
          return sheduledPostUser ? (
            <div
              className="user-info"
              onClick={() => navigate(`/profile/${sheduledPostUser.username}`)}
              style={{ cursor: "pointer" }}
            >
              <img
                className="user-avatar"
                src={`${API_URL}cdn/avatar/${sheduledPostUser?.avatarUrl}`}
              />
              <span>
                {user?.id === sheduledPostUser.id
                  ? "Вы"
                  : sheduledPostUser.username}
              </span>
            </div>
          ) : (
            `-`
          );
        },
      },
      {
        header: "Статус",
        accessorKey: "status",
        cell: ({ row }) => {
          const status = row.original.status;
          const errorDetails = row.original.errorDetails;
          const { label, color } = STATUS_MAP[status] || {
            label: status,
            color: "var(--text-color)",
          };
          return errorDetails ? (
            <Popover
              content={<div style={{ maxWidth: 300 }}>{errorDetails}</div>}
              title="Детали ошибки"
            >
              <span style={{ color, fontWeight: 500, fontSize: 14 }}>
                {label}
              </span>
            </Popover>
          ) : (
            <span style={{ color, fontWeight: 500, fontSize: 14 }}>
              {label}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "Действия",
        cell: ({ row }) => (
          <PostActions
            post={row.original}
            userId={userId}
            onEdit={(post) => setEditingPost(post)}
            onDelete={async (id) => {
              try {
                await deleteScheduledPost(id);
                queryClient.invalidateQueries({
                  queryKey: ["getScheduledPosts", userId],
                });
                notify({
                  type: "info",
                  title: "Информация",
                  body: `Пост ${id} отменен`,
                });
              } catch (error: any) {
                notify({
                  type: "error",
                  title: "Ошибка",
                  body: error.response?.data?.error || "Неизвестная ошибка",
                });
              }
            }}
            onRepeat={async (post) => {
              try {
                await updateScheduledPost(post.id, {
                  channelId: post.chatId,
                  text: post.text,
                  photos: post.photos,
                  videos: post.videos,
                  timestamp: post.timestamp,
                });
                queryClient.invalidateQueries({
                  queryKey: ["getScheduledPosts", userId],
                });
                notify({
                  type: "success",
                  title: "Успех",
                  body: `Пост ${post.id} обновлен`,
                });
              } catch (error: any) {
                notify({
                  type: "error",
                  title: "Ошибка",
                  body: error.response?.data?.error || "Неизвестная ошибка",
                });
              }
            }}
          />
        ),
      },
    ],
    [queryClient, userId, navigate, notify, user]
  );

  const table = useReactTable({
    data: filteredPosts.length ? filteredPosts : posts,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleSave = async () => {
    if (!editingPost) return;
    await updateScheduledPost(editingPost.id, {
      channelId: editingPost.chatId,
      text: editingPost.text,
      photos: editingPost.photos,
      videos: editingPost.videos,
      timestamp: editingPost.timestamp,
    });
    setEditingPost(null);
    queryClient.invalidateQueries({ queryKey: ["getScheduledPosts", userId] });
  };

  if (isLoading) return <div>Загрузка отложенных постов...</div>;
  if (isError) return <div>Ошибка при загрузке постов</div>;

  const rowsToRender = table.getRowModel().rows;

  return posts.length === 0 ? (
    <div>Отложенных постов нет</div>
  ) : (
    <div className="sheduled-posts">
      {contextHolder}
      <div className="sheduled-posts-header">
        <h2>Отложенные посты</h2>
        <SheduledPostFilter
          userId={userId}
          onFilter={(posts) => handleFilterDebounced(posts)}
        />
      </div>

      <div className="sheduled-posts-wrapper">
        <table className="sheduled-table">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id}>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {rowsToRender.map((row, rowIndex) => (
              <tr
                key={row.id}
                style={{
                  opacity: 0,
                  animation: `fadeIn 0.3s ease forwards`,
                  animationDelay: `${rowIndex * 40}ms`,
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        <EditPostModal
          post={editingPost}
          onCancel={() => setEditingPost(null)}
          onSave={handleSave}
          onChange={setEditingPost}
        />
      </div>
    </div>
  );
};

export default SheduledPosts;
