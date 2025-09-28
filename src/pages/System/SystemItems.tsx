// src/components/System/SystemItems.tsx
import { GridItem } from "../../components/GridWrapper/GridWrapper";
import DataBaseButton from "./SystemButtons/DataBaseButton/DataBaseButton";
import UserListButton from "./SystemButtons/UserListButton/UserListButton";

export const gridItems: React.ReactElement[] = [
  <GridItem
    key="user-list"
    colSpan={1}
    rowSpan={1}
    className="grid-item-redefine-wrapper"
  >
    <UserListButton />
  </GridItem>,
  <GridItem
    key="database-status"
    colSpan={1}
    rowSpan={1}
    className="grid-item-redefine-wrapper"
  >
    <DataBaseButton />
  </GridItem>,
  // Добавляй другие элементы сюда по необходимости
];
