// pages/SheduledPosts/SheduledPosts.tsx
import { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import "./UsersListPage.scss";
import { useNavigate } from "react-router";
import debounce from "lodash.debounce";
import { User } from "../../../../types/user";
import { getAllUsers, getUser } from "../../../../api/user";
import { useNotify } from "../../../../hooks/useNotify";
import UserAvatar from "../../../../components/UserAvatar/UserAvatar";
import { getPageHeaderIcon } from "../../../../config/route-icons";

const UsersList = ({ userId }: { userId?: string }) => {
  const queryClient = useQueryClient();
  const { data: user } = useQuery<User | null>({
    queryKey: ["user"],
    queryFn: () => getUser(),
  });
  const {
    data: users,
    isError,
    isLoading,
  } = useQuery<User[]>({
    queryKey: ["usersList"],
    queryFn: () => getAllUsers() as Promise<User[]>,
  });

  const navigate = useNavigate();
  const { notify, contextHolder } = useNotify();
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);

  // --- Дебаунс для фильтрации текста ---
  const handleFilterDebounced = useMemo(
    () =>
      debounce((users: User[]) => {
        setFilteredUsers(users);
      }, 200),
    [],
  );

  useEffect(() => {
    return () => {
      handleFilterDebounced.cancel();
    };
  }, [handleFilterDebounced]);

  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        header: "Аватар",
        accessorKey: "avatarUrl",
        cell: ({ row }) => {
          const thisUser = row.original;
          return (
            <div
              className="user-info"
              onClick={() => navigate(`/profile/${thisUser.username}`)}
              style={{ cursor: "pointer" }}
            >
              <UserAvatar
                avatarUrl={thisUser.avatarUrl}
                isOnline={thisUser.isOnline}
                size={36}
              />
            </div>
          );
        },
      },
      {
        header: "Имя",
        accessorKey: "firstName",
        cell: ({ row }) => row.original.firstName || "-",
      },
      {
        header: "Фамилия",
        accessorKey: "lastName",
        cell: ({ row }) => row.original.lastName || "-",
      },
      { header: "Никнейм", accessorKey: "username" },
      {
        header: "Роль",
        accessorKey: "role",
        cell: ({ row }) => {
          const { role } = row.original;
          return <span style={{ color: role?.color }}>{role?.name}</span>;
        },
      },
    ],
    [queryClient, userId, navigate, notify, user],
  );

  const table = useReactTable({
    data: filteredUsers.length ? filteredUsers : users || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) return <div>Загрузка списка пользователей...</div>;
  if (isError) return <div>Ошибка при загрузке списка пользователей</div>;

  const rowsToRender = table.getRowModel().rows;

  return users?.length === 0 ? (
    <div>Отложенных постов нет</div>
  ) : (
    <div className="sheduled-posts">
      {contextHolder}
      <div className="sheduled-posts-header">
        <div className="page-header__title">
          {getPageHeaderIcon("/system/users")}
          <h2>Список пользователей</h2>
        </div>
        {/* <SheduledPostFilter
          userId={userId}
          onFilter={(posts) => handleFilterDebounced(posts)}
        /> */}
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
                      header.getContext(),
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
                  cursor: "pointer",
                }}
                onClick={() => navigate(`/profile/${row.original.id}`)}
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
      </div>
    </div>
  );
};

export default UsersList;
