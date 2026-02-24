import { Outlet, Route, Routes } from "react-router-dom";
import { ConfigProvider, theme } from "antd";
import SmartHome from "./components/SmartHome";
import { usePageTracking } from "./hooks/usePageTracking";
import Other from "./pages/Other/Other";
import AllPosts from "./pages/TgCosmos/components/AllPosts/AllPosts";
import AuthPage from "./pages/AuthPage/AuthPage";
import ProtectedRoute from "./components/ProtectedRoute";
import useTheme from "./hooks/useTheme";
import Profile from "./pages/Profile/Profile";
import SheduledPosts from "./pages/SheduledPosts/SheduledPosts";
import System from "./pages/System/System";
import UsersList from "./pages/System/system-pages/UsersListPage/UsersListPage";
import LLMModelsPage from "./pages/System/system-pages/LLMModelsPage/LLMModelsPage";
import ThemesPage from "./pages/System/system-pages/ThemesPage/ThemesPage";
import ThemeEditPage from "./pages/System/system-pages/ThemesPage/ThemeEditPage";
import Settings from "./pages/Settings/Settings";
import Animations from "./pages/Animations/Animations";
import AnimationDetail from "./pages/Animations/AnimationDetail";
import Devices from "./pages/Devices/Devices";
import DeviceDetail from "./pages/Devices/DeviceDetail";
import Ota from "./pages/Ota/Ota";
import Chat from "./pages/Chat/Chat";
import LeftNav from "./components/LeftNav/LeftNav";
import { SelectedThemeProvider } from "./contexts/SelectedThemeContext";

const AuthLayout = () => (
  <ProtectedRoute>
    <SelectedThemeProvider>
      <div className="app-layout">
        <div className="app-shell">
          <LeftNav />
          <div className="router-wrapper">
            <Outlet />
          </div>
        </div>
      </div>
    </SelectedThemeProvider>
  </ProtectedRoute>
);

const antdDarkConfig = {
  theme: {
    algorithm: theme.darkAlgorithm,
    token: {
      colorText: "var(--text-color)",
      colorPrimary: "var(--button-primary-bg)",
      colorTextBase: "var(--text-color)",
      colorTextSecondary: "var(--text-secondary)",
      colorBgBase: "var(--background-color)",
      colorBgContainer: "var(--input-background)",
      colorBorder: "var(--border-color)",
      colorLink: "var(--link-color)",
      borderRadius: 6,
    },
    components: {
      DatePicker: {
        colorPrimary: "var(--button-primary-bg)",
        colorBgBase: "var(--background-color)",
        colorBgContainer: "var(--input-background)",
      },
    },
  },
};

export const App = () => {
  const [currentTheme] = useTheme();
  usePageTracking();
  const antdConfig = currentTheme === "dark" ? antdDarkConfig : {};
  return (
    <ConfigProvider {...antdConfig}>
      <Routes>
        <Route path="/login" element={<AuthPage />} />

        <Route element={<AuthLayout />}>
          <Route path="/" element={<SmartHome />} />
          <Route path="/tgcosmos/allPosts" element={<AllPosts />} />
          <Route path="/other" element={<Other />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:id" element={<Profile />} />
          <Route path="/notifications" element={<h1>Notifications</h1>} />
          <Route path="/sheduled-posts" element={<SheduledPosts />} />
          <Route path="/system" element={<System />} />
          <Route path="/system/users" element={<UsersList />} />
          <Route path="/system/llm-models" element={<LLMModelsPage />} />
          <Route path="/system/themes" element={<ThemesPage />} />
          <Route path="/system/themes/:id" element={<ThemeEditPage />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/animations" element={<Animations />} />
          <Route path="/animation/:id" element={<AnimationDetail />} />
          <Route path="/devices" element={<Devices />} />
          <Route path="/devices/:id" element={<DeviceDetail />} />
          <Route path="/ota" element={<Ota />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/chat/:sessionId" element={<Chat />} />
        </Route>
      </Routes>
    </ConfigProvider>
  );
};
