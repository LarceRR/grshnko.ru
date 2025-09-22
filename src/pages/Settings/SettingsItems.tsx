// src/components/System/SystemItems.tsx
import { GridItem } from "../../components/GridWrapper/GridWrapper";
import TelegramAuthButton from "./SettingsButtons/TelegramAuthButton/TelegramAuthButton";

export const gridItems: React.ReactElement[] = [
  <GridItem
    key="telegram-auth-button"
    colSpan={3}
    rowSpan={1}
    className="grid-item-redefine-wrapper"
  >
    <TelegramAuthButton />
  </GridItem>,
  // Добавляй другие элементы сюда по необходимости
];
