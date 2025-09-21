// src/hooks/useGridCalculation.ts

import { useState, useLayoutEffect, RefObject } from "react";

/**
 * Интерфейс для возвращаемого значения хука.
 */
interface GridConfig {
  columns: number;        // Рассчитанное количество колонок
  rows: number;           // Рассчитанное количество строк
  actualCellSize: number; // Рассчитанный точный размер ячейки в пикселях для сохранения пропорций 1:1
}

/**
 * Кастомный хук для вычисления параметров адаптивной CSS Grid.
 * @param containerRef - Ref на DOM-элемент контейнера сетки.
 * @param desiredCellSize - Желаемый (приблизительный) размер ячейки в пикселях.
 * @param gap - Отступ между ячейками в пикселях.
 * @returns {GridConfig} - Объект с рассчитанными параметрами сетки.
 */
export const useGridCalculation = (
  containerRef: RefObject<HTMLElement | null>,
  desiredCellSize: number,
  gap: number
): GridConfig => {
  const [gridConfig, setGridConfig] = useState<GridConfig>({
    columns: 0,
    rows: 0,
    actualCellSize: 0,
  });

  // Используем useLayoutEffect для синхронных измерений DOM перед отрисовкой
  useLayoutEffect(() => {
    const calculateGrid = () => {
      // Прерываем выполнение, если контейнер еще не смонтирован
      if (!containerRef.current) return;

      const parentWidth = containerRef.current.clientWidth;
      const parentHeight = containerRef.current.clientHeight;

      // Рассчитываем, сколько колонок может поместиться
      const calculatedCols = Math.max(
        1,
        Math.floor((parentWidth + gap) / (desiredCellSize + gap))
      );

      // Рассчитываем реальную ширину ячейки, чтобы сетка заняла 100% ширины
      const totalGapWidth = (calculatedCols - 1) * gap;
      const actualCellWidth = Math.max(0, (parentWidth - totalGapWidth) / calculatedCols);
      
      // Рассчитываем, сколько строк поместится по высоте, используя реальный размер ячейки
      const calculatedRows = Math.max(
          1, 
          Math.floor((parentHeight + gap) / (actualCellWidth + gap))
      );

      // Сохраняем все вычисленные значения
      setGridConfig({
        columns: calculatedCols,
        rows: calculatedRows,
        actualCellSize: actualCellWidth,
      });
    };

    // Выполняем расчет при монтировании
    calculateGrid();

    // Добавляем слушатель для пересчета при изменении размера окна
    window.addEventListener("resize", calculateGrid);
    
    // Очищаем слушатель при размонтировании
    return () => window.removeEventListener("resize", calculateGrid);
  }, [containerRef, desiredCellSize, gap]); // Зависимости хука

  return gridConfig;
};