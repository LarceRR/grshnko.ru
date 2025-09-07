// components/ProtectedRoute.tsx
import { Navigate } from "react-router-dom";
import { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { getUser } from "../api/user";
import LoadingBanner from "./LoadingBanner/LoadingBanner";

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

const ProtectedRoute = ({
  children,
  redirectTo = "/login",
}: ProtectedRouteProps) => {
  const { data: user, isLoading } = useQuery({
    queryKey: ["user"],
    queryFn: getUser,
    retry: false,
    staleTime: 0, // Всегда проверять актуальность
  });

  // Пока идёт загрузка пользователя
  if (isLoading) {
    return <LoadingBanner />;
  }

  // Если пользователь не авторизован — редирект
  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  // Если пользователь авторизован — показываем children
  return <>{children}</>;
};

export default ProtectedRoute;
