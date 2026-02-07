// src/components/System/SystemItems.tsx
import { GridItem } from "../../components/GridWrapper/GridWrapper";
import DataBaseButton from "./SystemButtons/DataBaseButton/DataBaseButton";
import UserListButton from "./SystemButtons/UserListButton/UserListButton";
import AnimationsButton from "./SystemButtons/AnimationsButton/AnimationsButton";
import DevicesButton from "./SystemButtons/DevicesButton/DevicesButton";

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
  <GridItem
    key="animations"
    colSpan={1}
    rowSpan={1}
    className="grid-item-redefine-wrapper"
  >
    <AnimationsButton />
  </GridItem>,
  <GridItem
    key="devices"
    colSpan={1}
    rowSpan={1}
    className="grid-item-redefine-wrapper"
  >
    <DevicesButton />
  </GridItem>,
];
