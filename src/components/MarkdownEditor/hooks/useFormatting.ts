import { useState, useCallback } from "react";
import { Entity } from "../types";
import { formatTextToHTML } from "../utils/formatting";
import { getTextOffsetFromRange } from "../utils/selection";

/**
 * Находит текстовый узел или BR элемент на указанном offset
 * Учитывает, что <br> элементы в innerText дают один символ (\n)
 */
const findNodeAtOffset = (
  container: HTMLElement,
  targetOffset: number
): { node: Node; isBR: boolean } | null => {
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
    {
      acceptNode: (node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          return NodeFilter.FILTER_ACCEPT;
        }
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as HTMLElement;
          if (el.tagName === "BR") {
            return NodeFilter.FILTER_ACCEPT;
          }
        }
        return NodeFilter.FILTER_SKIP;
      },
    }
  );

  let currentOffset = 0;
  let node: Node | null;

  while ((node = walker.nextNode())) {
    if (node.nodeType === Node.TEXT_NODE) {
      const textNode = node as Text;
      const nodeLength = textNode.textContent?.length || 0;

      if (currentOffset + nodeLength >= targetOffset) {
        return { node: textNode, isBR: false };
      }

      currentOffset += nodeLength;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      if (el.tagName === "BR") {
        // <br> дает один символ в innerText
        if (currentOffset >= targetOffset) {
          return { node: el, isBR: true };
        }
        currentOffset += 1;
      }
    }
  }

  // Если не нашли, возвращаем последний текстовый узел
  const lastTextNode = getLastTextNode(container);
  if (lastTextNode) {
    return { node: lastTextNode, isBR: false };
  }

  return null;
};

/**
 * Получает offset перед указанным узлом
 * Учитывает <br> элементы
 */
const getOffsetBeforeNode = (
  container: HTMLElement,
  targetNode: Node
): number => {
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
    {
      acceptNode: (node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          return NodeFilter.FILTER_ACCEPT;
        }
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as HTMLElement;
          if (el.tagName === "BR") {
            return NodeFilter.FILTER_ACCEPT;
          }
        }
        return NodeFilter.FILTER_SKIP;
      },
    }
  );

  let offset = 0;
  let node: Node | null;

  while ((node = walker.nextNode())) {
    if (node === targetNode) {
      break;
    }
    if (node.nodeType === Node.TEXT_NODE) {
      offset += (node.textContent?.length || 0);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      if (el.tagName === "BR") {
        offset += 1; // <br> дает один символ в innerText
      }
    }
  }

  return offset;
};

/**
 * Получает последний текстовый узел в контейнере
 */
const getLastTextNode = (container: HTMLElement): Text | null => {
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    null
  );

  let lastNode: Text | null = null;
  let node: Node | null;

  while ((node = walker.nextNode())) {
    lastNode = node as Text;
  }

  return lastNode;
};

interface UseFormattingProps {
  text: string;
  entities: Entity[];
  onEntitiesChange?: (entities: Entity[]) => void;
  onChange?: (text: string) => void;
  onHistoryPush: (text: string, entities: Entity[]) => void;
  editorRef: React.RefObject<HTMLDivElement | null>;
}

export const useFormatting = ({
  text,
  entities,
  onEntitiesChange,
  onChange,
  onHistoryPush,
  editorRef,
}: UseFormattingProps) => {
  const [activeFormats, setActiveFormats] = useState<Set<Entity["type"]>>(
    new Set()
  );

  const applyFormatting = useCallback(
    (type: Entity["type"]) => {
      if (!editorRef.current) return;

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      
      // Получаем offset в plain text (корректно обрабатывает переносы строк)
      const { start: startOffset, end: endOffset } = getTextOffsetFromRange(
        range,
        editorRef.current
      );

      // Вычисляем длину выделенного текста через offset
      const selectedLength = endOffset - startOffset;
      
      // Проверяем, что есть выделенный текст
      if (selectedLength <= 0) return;

      const isActive = activeFormats.has(type);

      let newEntities = [...entities];

      if (isActive) {
        // Удаляем форматирование
        newEntities = newEntities.filter(
          (e) =>
            !(
              e.type === type &&
              startOffset >= e.offset &&
              endOffset <= e.offset + e.length
            )
        );
      } else {
        // Добавляем форматирование
        if (type === "text_url") {
          const url = prompt("Введите ссылку") || "";
          newEntities.push({
            type: "text_url",
            offset: startOffset,
            length: selectedLength,
            url,
          });
        } else {
          newEntities.push({
            type,
            offset: startOffset,
            length: selectedLength,
          });
        }
      }

      // Получаем актуальный текст из контейнера (может отличаться от state)
      const currentText = editorRef.current.innerText || "";
      
      // Сохраняем позицию курсора для восстановления
      const cursorOffset = endOffset;
      
      // Обновляем HTML с новыми entities
      const newHTML = formatTextToHTML(currentText, newEntities);
      editorRef.current.innerHTML = newHTML;

      // Восстанавливаем позицию курсора после обновления HTML
      // Пробуем восстановить позицию по offset в новом DOM
      setTimeout(() => {
        try {
          const newSelection = window.getSelection();
          if (!newSelection || !editorRef.current) return;

          // Находим узел (текстовый или BR) и позицию по offset
          const nodeInfo = findNodeAtOffset(editorRef.current, cursorOffset);
          if (nodeInfo) {
            const { node, isBR } = nodeInfo;
            const newRange = document.createRange();
            
            if (isBR) {
              // Если это BR элемент, устанавливаем курсор после него
              newRange.setStartAfter(node);
              newRange.setEndAfter(node);
            } else {
              // Если это текстовый узел, вычисляем позицию внутри него
              const textNode = node as Text;
              const offsetBeforeNode = getOffsetBeforeNode(editorRef.current, textNode);
              const nodeText = textNode.textContent || "";
              const offsetInNode = Math.min(
                cursorOffset - offsetBeforeNode,
                nodeText.length
              );
              
              newRange.setStart(textNode, offsetInNode);
              newRange.setEnd(textNode, offsetInNode);
            }
            
            newSelection.removeAllRanges();
            newSelection.addRange(newRange);
          }
        } catch (e) {
          // Если не удалось восстановить позицию, игнорируем ошибку
        }
      }, 0);

      // Обновляем entities
      onEntitiesChange?.(newEntities);

      // Обновляем plain text (синхронизируем с контейнером)
      if (currentText !== text) {
        onChange?.(currentText);
      }

      // Сохраняем в историю с актуальным текстом
      onHistoryPush(currentText, newEntities);
    },
    [
      text,
      entities,
      activeFormats,
      editorRef,
      onChange,
      onEntitiesChange,
      onHistoryPush,
    ]
  );

  const clearFormatting = useCallback(() => {
    onEntitiesChange?.([]);
    if (editorRef.current) {
      editorRef.current.innerText = text;
    }
    onHistoryPush(text, []);
  }, [text, editorRef, onEntitiesChange, onHistoryPush]);

  const updateActiveFormats = useCallback(() => {
    if (!editorRef.current) return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      setActiveFormats(new Set());
      return;
    }

    const range = selection.getRangeAt(0);
    const { start, end } = getTextOffsetFromRange(range, editorRef.current);

    const active = new Set<Entity["type"]>();
    entities.forEach((e) => {
      if (start >= e.offset && end <= e.offset + e.length) {
        active.add(e.type);
      }
    });
    setActiveFormats(active);
  }, [entities, editorRef]);

  return {
    activeFormats,
    applyFormatting,
    clearFormatting,
    updateActiveFormats,
  };
};

