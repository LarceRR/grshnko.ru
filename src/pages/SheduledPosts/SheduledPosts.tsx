import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getScheduledPosts,
  deleteScheduledPost,
  createScheduledPost,
} from "../../api/sheduledPosts";
import { ScheduledPost, STATUS_MAP } from "../../types/sheduledPost";
import {
  ColumnDef,
  flexRender,
  useReactTable,
  getCoreRowModel,
} from "@tanstack/react-table";
import { Modal, Input, Space } from "antd";
import "./SheduledPosts.scss";
import { Pen, Repeat2, Trash } from "lucide-react";
import { toDatetimeLocalValue } from "../../utils/date";

const SheduledPosts = ({ userId }: { userId?: string }) => {
  const queryClient = useQueryClient();
  const {
    data: posts = [],
    isLoading,
    isError,
  } = useQuery<ScheduledPost[]>({
    queryKey: ["getScheduledPosts", userId],
    queryFn: () => getScheduledPosts(userId),
    retry: false,
  });

  const [editingPost, setEditingPost] = useState<ScheduledPost | null>(null);
  const [searchText, _] = useState("");

  // Фильтрация по поиску
  const filteredPosts = useMemo(() => {
    if (!searchText) return posts;
    return posts.filter(
      (p) =>
        p.text?.toLowerCase().includes(searchText.toLowerCase()) ||
        p.chatId.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [posts, searchText]);

  const columns = useMemo<ColumnDef<ScheduledPost>[]>(
    () => [
      {
        header: "Текст",
        accessorKey: "text",
      },
      {
        header: "Канал",
        accessorKey: "chatId",
      },
      {
        header: "Дата публикации",
        accessorKey: "timestamp",
        cell: (info) => new Date(info.getValue() as string).toLocaleString(),
      },
      {
        header: "Статус",
        accessorKey: "status",
        cell: ({ getValue }) => {
          const status = getValue<ScheduledPost["status"]>();
          const { label, color } = STATUS_MAP[status] || {
            label: status,
            color: "var(--text-color)",
          };
          return (
            <span style={{ color, fontWeight: 500, fontSize: 14 }}>
              {label}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "Действия",
        cell: ({ row }) => {
          const post = row.original;
          return (
            <div className="actions">
              <Space>
                {post.status !== "SENT" && (
                  <Trash
                    onClick={async () => {
                      await deleteScheduledPost(post.id);
                      queryClient.invalidateQueries({
                        queryKey: ["getScheduledPosts", userId],
                      });
                    }}
                    size={16}
                    color="var(--color-red)"
                    style={{ cursor: "pointer" }}
                  />
                )}
                <Pen
                  onClick={() => setEditingPost(post)}
                  size={16}
                  color="var(--color-orange)"
                  style={{ cursor: "pointer" }}
                />
                <Repeat2
                  onClick={async () => {
                    await createScheduledPost({
                      userId: post.userId,
                      channelId: post.chatId,
                      text: post.text,
                      photos: post.photos,
                      videos: post.videos,
                      timestamp: post.timestamp,
                    });
                    queryClient.invalidateQueries({
                      queryKey: ["getScheduledPosts", userId],
                    });
                  }}
                  size={16}
                  color="var(--color-green)"
                  style={{ cursor: "pointer" }}
                />
              </Space>
            </div>
          );
        },
      },
    ],
    [queryClient, userId]
  );

  const table = useReactTable({
    data: filteredPosts,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  // --- Рендер модалки редактирования ---
  const handleSave = async () => {
    if (!editingPost) return;
    await createScheduledPost({
      userId: editingPost.userId,
      channelId: editingPost.chatId,
      text: editingPost.text,
      photos: editingPost.photos,
      videos: editingPost.videos,
      timestamp: editingPost.timestamp,
    });
    setEditingPost(null);
    queryClient.invalidateQueries({
      queryKey: ["getScheduledPosts", userId],
    });
  };

  if (isLoading) return <div>Загрузка отложенных постов...</div>;
  if (isError) return <div>Ошибка при загрузке постов</div>;

  return (
    <div className="sheduled-posts">
      <h2>Отложенные посты</h2>
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
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        <Modal
          title="Редактировать отложенный пост"
          open={!!editingPost}
          onCancel={() => setEditingPost(null)}
          onOk={handleSave}
          okText="Сохранить"
          cancelText="Отмена"
        >
          {editingPost && (
            <div className="modal-content">
              <Input
                placeholder="Текст"
                value={editingPost.text}
                onChange={(e) =>
                  setEditingPost({ ...editingPost, text: e.target.value })
                }
                style={{ marginBottom: "1rem" }}
              />
              <Input
                placeholder="Канал"
                value={editingPost.chatId}
                onChange={(e) =>
                  setEditingPost({ ...editingPost, chatId: e.target.value })
                }
                style={{ marginBottom: "1rem" }}
              />
              <Input
                placeholder="Дата публикации"
                type="datetime-local"
                value={toDatetimeLocalValue(editingPost.timestamp)}
                onChange={(e) => {
                  const localDate = new Date(e.target.value); // локальное время
                  setEditingPost({
                    ...editingPost,
                    timestamp: localDate.toISOString(), // сохраняем в UTC
                  });
                }}
              />
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default SheduledPosts;
