import { Route, Routes } from "react-router-dom";
import TgCosmos from "./pages/TgCosmos/TgCosmos";
import Other from "./pages/Other/Other";
import AllPosts from "./pages/TgCosmos/components/AllPosts/AllPosts";
import AuthPage from "./pages/AuthPage/AuthPage";
import Navigator from "./components/Navigator/Navigator";
import ProtectedRoute from "./components/ProtectedRoute";
import useTheme from "./hooks/useTheme";
import Profile from "./pages/Profile/Profile";
import SheduledPosts from "./pages/SheduledPosts/SheduledPosts";
import System from "./pages/System/System";
import UsersList from "./pages/System/system-pages/UsersListPage/UsersListPage";
import Settings from "./pages/Settings/Settings";

export const App = () => {
  const [__, _] = useTheme();
  return (
    <div className="router-wrapper">
      <Routes>
        {/* Страница авторизации не защищена */}
        <Route path="/login" element={<AuthPage />} />

        {/* Приватные страницы */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Navigator />
              <TgCosmos />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tgcosmos/allPosts"
          element={
            <ProtectedRoute>
              <Navigator />
              <AllPosts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/other"
          element={
            <ProtectedRoute>
              <Navigator />
              <Other />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Navigator />
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Navigator />
              <h1>Notifications</h1>
            </ProtectedRoute>
          }
        />
        <Route
          path="/sheduled-posts"
          element={
            <ProtectedRoute>
              <Navigator />
              <SheduledPosts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/:id"
          element={
            <ProtectedRoute>
              <Navigator />
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/system/users"
          element={
            <ProtectedRoute>
              <Navigator />
              <UsersList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/system"
          element={
            <ProtectedRoute>
              <Navigator />
              <System />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Navigator />
              <Settings />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
};
