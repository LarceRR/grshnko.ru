import React, { useMemo } from "react";
import "./ActiveSessions.scss";
import { useQuery } from "@tanstack/react-query";
import {
  deleteSession,
  getSessionByUserId,
  ISession,
} from "../../../api/session";
import UserAgent from "./UserAgent/UserAgent";
import { LogOut } from "lucide-react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";
import dayjs from "dayjs";
import CircleImage from "../../../components/CircleImage/CircleImage";
import { API_URL } from "../../../config";
import LoaderSpinner from "../../../components/LoadingBanner/LoaderSpinner/LoaderSpinner";

interface IActiveSessionsProps {
  userId: string | undefined;
}

const ActiveSessions: React.FC<IActiveSessionsProps> = ({ userId }) => {
  const {
    data: sessions,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["active_sessions", userId],
    queryFn: () => getSessionByUserId(userId ?? ""),
    retry: false,
    enabled: !!userId,
  });

  const columns = useMemo<ColumnDef<ISession, any>[]>(
    () => [
      {
        header: "Пользователь",
        id: "actions",
        cell: ({ row }) => (
          <CircleImage
            className="user-avatar"
            src={
              `${API_URL}cdn/avatar/${row.original.user.avatarUrl}` ||
              "/default-avatar.png"
            }
          />
        ),
      },
      { header: "IP", accessorKey: "ipAddress" },
      {
        header: "Обновлено",
        accessorKey: "updatedAt",
        cell: (info) => dayjs(info.getValue() as string).fromNow(), // "15м назад"
      },
      {
        header: "Браузер/ОС",
        accessorKey: "userAgent",
        cell: (info) => <UserAgent useragent={info.getValue() as string} />,
      },
      {
        header: "Действия",
        id: "actions",
        cell: ({ row }) => (
          <div className="actions">
            <LogOut
              size={20}
              color="var(--color-red)"
              onClick={() => deleteSession(row.original.id)}
            />
          </div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: sessions ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) return <LoaderSpinner />;
  if (isError) return <div>Ошибка при загрузке сессий</div>;

  return (
    <div className="sessions-wrapper">
      {sessions?.length ? (
        <table className="sessions-table">
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
      ) : (
        <div className="empty-data">Нет активных сессий</div>
      )}
    </div>
  );
};

export default ActiveSessions;
