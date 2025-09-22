// src/components/System/System.tsx

import { useQuery } from "@tanstack/react-query";
import React, { useState, useRef } from "react";
import GridWrapper, {
  GridItem,
  IGridItemProps,
} from "../../components/GridWrapper/GridWrapper";
import { getUser } from "../../api/user";
import "./Settings.scss";
import { useGridCalculation } from "../../hooks/useGridCalculation";
import { gridItems } from "./SettingsItems";

const Settings = () => {
  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => getUser(),
    retry: false,
    staleTime: 0,
  });

  const [showGridPositions, setShowGridPositions] = useState(false);

  const gridContainerRef = useRef<HTMLDivElement>(null);
  const desiredCellSize = 100;
  const gap = 8;
  const animationDelayIncrement = 2;

  const { columns, rows, actualCellSize } = useGridCalculation(
    gridContainerRef,
    desiredCellSize,
    gap
  );

  // Эта функция больше не нуждается в zIndex, так как весь ее контейнер будет ниже
  const generateGridMarkers = (
    totalColumns: number,
    totalRows: number
  ): React.ReactElement<IGridItemProps>[] => {
    const markers: React.ReactElement<IGridItemProps>[] = [];
    let markerIndex = 0;
    for (let row = 1; row <= totalRows; row++) {
      for (let col = 1; col <= totalColumns; col++) {
        const delay = markerIndex * animationDelayIncrement;
        markers.push(
          <GridItem
            key={`marker-${col}-${row}`}
            col={col}
            row={row}
            className="fade-in"
            style={{
              backgroundColor: "rgba(0,0,0,0.05)",
              animationDelay: `${delay}ms`,
            }}
          >
            <div className="grid-position-marker">
              <span className="position">
                [ {col} , {row} ]
              </span>
            </div>
          </GridItem>
        );
        markerIndex++;
      }
    }
    return markers;
  };

  const mainItemsArray = React.Children.toArray(gridItems);

  return (
    <div className="system-card">
      <h1>
        Настройки
        {user?.role?.key === "ADMIN" && (
          <button
            onClick={() => setShowGridPositions(!showGridPositions)}
            className={`switch-button ${showGridPositions ? "active" : ""}`}
          >
            {showGridPositions
              ? "Скрыть позиции сетки"
              : "Показать позиции сетки"}
          </button>
        )}
      </h1>

      {/* --- КЛЮЧЕВОЕ ИЗМЕНЕНИЕ: КОНТЕЙНЕР ДЛЯ ПОЗИЦИОНИРОВАНИЯ --- */}
      <div className="grid-area-container">
        {/* Основная сетка с контентом */}
        <GridWrapper
          ref={gridContainerRef}
          columns={columns}
          rows={rows}
          cellSize={actualCellSize}
          gap={gap}
        >
          {mainItemsArray.map((child, index) => {
            if (React.isValidElement<IGridItemProps>(child)) {
              return React.cloneElement(child, {
                className: `${child.props.className || ""} fade-in`.trim(),
                style: {
                  ...child.props.style,
                  animationDelay: `${index * animationDelayIncrement}ms`,
                  position: "relative", // Необходимо для z-index
                  zIndex: 2, // Контент всегда выше маркеров
                },
              });
            }
            return child;
          })}
        </GridWrapper>

        {/* Сетка для маркеров (рендерится только в режиме админа) */}
        {showGridPositions && (
          <GridWrapper
            className="grid-wrapper--markers" // Специальный класс для позиционирования
            columns={columns}
            rows={rows}
            cellSize={actualCellSize}
            gap={gap}
          >
            {generateGridMarkers(columns, rows)}
          </GridWrapper>
        )}
      </div>
    </div>
  );
};

export default Settings;
