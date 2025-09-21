import React, { ReactNode } from "react";
import { ConfigProvider, theme } from "antd";
import useTheme from "../../hooks/useTheme";

interface Props {
  children: ReactNode;
}

const AntDRedisagnedProvider: React.FC<Props> = ({ children }) => {
  const [currentTheme] = useTheme(); // используем хук

  // Если тема светлая, конфиг пустой
  const antdConfig =
    currentTheme === "dark"
      ? {
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
        }
      : {}; // светлая тема — пустой конфиг

  return <ConfigProvider {...antdConfig}>{children}</ConfigProvider>;
};

export default AntDRedisagnedProvider;
