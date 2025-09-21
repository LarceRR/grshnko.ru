// src/components/GridWrapper/GridWrapper.tsx

import React, { ReactNode, CSSProperties, forwardRef } from "react";
import "./GridWrapper.scss";

export interface IGridItemProps {
  children?: ReactNode;
  col?: number; // Теперь опционален для авто-размещения
  row?: number; // Теперь опционален для авто-размещения
  colSpan?: number;
  rowSpan?: number;
  style?: CSSProperties;
  className?: string;
}

export const GridItem: React.FC<IGridItemProps> = ({
  children,
  col, // Может быть undefined
  row, // Может быть undefined
  colSpan = 1,
  rowSpan = 1,
  style,
  className = "",
}) => {
  // --- КЛЮЧЕВОЕ ИЗМЕНЕНИЕ ---
  // Создаем стили для позиционирования динамически.
  // Если `col` не задан, используем только `span`, что включает авто-размещение.
  // Если `col` задан (для маркеров), используем явное позиционирование.
  const gridColumnStyle = col ? `${col} / span ${colSpan}` : `span ${colSpan}`;
  const gridRowStyle = row ? `${row} / span ${rowSpan}` : `span ${rowSpan}`;

  return (
    <div
      className={`grid-item ${className}`}
      style={{
        gridColumn: gridColumnStyle,
        gridRow: gridRowStyle,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

interface IGridWrapperProps {
  children?: ReactNode;
  columns: number;
  rows: number;
  cellSize: number;
  gap?: number;
  className?: string;
  style?: CSSProperties;
}

// В GridWrapper изменений нет, он по-прежнему просто создает сетку
const GridWrapper = forwardRef<HTMLDivElement, IGridWrapperProps>(
  ({ children, columns, rows, cellSize, gap = 0, className, style }, ref) => {
    return (
      <div
        ref={ref}
        className={`grid-wrapper ${className || ""}`}
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
          gap: `${gap}px`,
          width: "100%",
          height: "100%",
          overflow: "hidden",
          ...style,
        }}
      >
        {children}
      </div>
    );
  }
);

export default GridWrapper;
