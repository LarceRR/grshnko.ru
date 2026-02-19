// src/components/System/SystemItems.tsx
import React from "react";
import { GridItem } from "../../components/GridWrapper/GridWrapper";
import TelegramAuthButton from "./SettingsButtons/TelegramAuthButton/TelegramAuthButton";
import StartupPageSelector from "./SettingsButtons/StartupPageSelector/StartupPageSelector";

export const gridItems: React.ReactElement[] = [
  <GridItem
    key="telegram-auth-button"
    colSpan={3}
    rowSpan={1}
    className="grid-item-redefine-wrapper"
  >
    <TelegramAuthButton />
  </GridItem>,
  <GridItem
    key="startup-page-selector"
    col={1}
    row={2}
    colSpan={3}
    rowSpan={2}
    className="grid-item-redefine-wrapper"
  >
    <StartupPageSelector />
  </GridItem>,
  // Добавляй другие элементы сюда по необходимости
];
