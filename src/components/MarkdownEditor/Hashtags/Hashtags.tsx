import React, { useMemo } from "react";
import { X } from "lucide-react";
import {
  extractHashtags,
  hasHashtags,
  findLastHashtagEndPosition,
} from "../utils/hashtags";
import { useHashtagsHistory } from "../hooks/useHashtagsHistory";
import "./Hashtags.scss";

interface HashtagsProps {
  text: string;
  editorRef: React.RefObject<HTMLElement | null>;
  onTextChange: (newText: string) => void;
  onHistoryPush?: (text: string) => void;
}

const Hashtags: React.FC<HashtagsProps> = ({
  text,
  editorRef,
  onTextChange,
  onHistoryPush,
}) => {
  const { getSortedHistory } = useHashtagsHistory();

  // Извлекаем хештеги из текущего текста
  const currentHashtags = useMemo(() => {
    return extractHashtags(text);
  }, [text]);

  // Проверяем, есть ли хештеги в тексте
  const hasHashtagsInText = useMemo(() => {
    return hasHashtags(text);
  }, [text]);

  // Удаление хештега из текста
  const removeHashtag = (tagToRemove: string) => {
    // Экранируем специальные символы для regex
    const escapedTag = tagToRemove.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Ищем хештег с учетом границ слов и возможных пробелов
    const regex = new RegExp(`(\\s|^)${escapedTag}(\\s|$)`, "gi");

    let newText = text;
    let replaced = false;

    // Заменяем найденные вхождения
    newText = newText.replace(regex, (_match, before, after) => {
      replaced = true;
      // Сохраняем пробелы только если они нужны для разделения
      if (before && after) {
        return " "; // Оставляем один пробел между словами
      }
      return before || after || ""; // Возвращаем оставшийся пробел или пустую строку
    });

    // Очищаем множественные пробелы и лишние переносы строк
    newText = newText.replace(/[ \t]{2,}/g, " "); // Множественные пробелы -> один
    newText = newText.replace(/\n\s*\n\s*\n+/g, "\n\n"); // Тройные+ переносы -> двойной
    newText = newText.trim();

    if (replaced) {
      onTextChange(newText);
      onHistoryPush?.(newText);

      // Обновляем DOM
      if (editorRef.current) {
        if (editorRef.current instanceof HTMLDivElement) {
          // Сохраняем форматирование через innerText
          editorRef.current.innerText = newText;
        } else if (
          editorRef.current instanceof HTMLTextAreaElement ||
          editorRef.current instanceof HTMLInputElement
        ) {
          editorRef.current.value = newText;
          // Вызываем событие input для синхронизации
          editorRef.current.dispatchEvent(
            new Event("input", { bubbles: true })
          );
        }
      }
    }
  };

  // Вставка хештега в текст
  const insertHashtag = (tag: string) => {
    let newText = text;
    let insertPosition = newText.length;

    if (!hasHashtagsInText) {
      // Если хештегов нет, добавляем через два Enter (на вторую новую строку)
      if (newText.length > 0) {
        if (!newText.endsWith("\n\n")) {
          if (newText.endsWith("\n")) {
            newText += "\n";
          } else {
            newText += "\n\n";
          }
        }
        insertPosition = newText.length;
        newText += tag;
      } else {
        // Если текст пустой, добавляем два переноса и хештег
        newText = "\n\n" + tag;
        insertPosition = newText.length;
      }
    } else {
      // Если хештеги есть, добавляем на той же строке
      const lastHashtagEnd = findLastHashtagEndPosition(text);
      if (lastHashtagEnd !== -1) {
        // Находим конец строки с последним хештегом
        const textAfterLastHashtag = text.slice(lastHashtagEnd);
        const nextLineBreak = textAfterLastHashtag.indexOf("\n");

        if (nextLineBreak === -1 || nextLineBreak > 0) {
          // Если нет переноса строки сразу после хештега или он далеко, добавляем на той же строке
          insertPosition = lastHashtagEnd;
          newText =
            text.slice(0, insertPosition) +
            " " +
            tag +
            text.slice(insertPosition);
          insertPosition = insertPosition + tag.length + 1; // +1 за пробел
        } else {
          // Если есть перенос строки сразу после, добавляем перед ним
          insertPosition = lastHashtagEnd;
          newText =
            text.slice(0, insertPosition) +
            " " +
            tag +
            text.slice(insertPosition);
          insertPosition = insertPosition + tag.length + 1;
        }
      } else {
        // Если не нашли позицию, добавляем в конец
        newText += " " + tag;
        insertPosition = newText.length;
      }
    }

    onTextChange(newText);
    onHistoryPush?.(newText);
    // Обновляем DOM и позицию курсора
    setTimeout(() => {
      if (editorRef.current) {
        if (editorRef.current instanceof HTMLDivElement) {
          // Устанавливаем новый текст
          editorRef.current.innerText = newText;

          // Перемещаем курсор в конец вставленного хештега
          try {
            const selection = window.getSelection();
            if (selection) {
              const walker = document.createTreeWalker(
                editorRef.current,
                NodeFilter.SHOW_TEXT,
                null
              );

              let currentOffset = 0;
              let node: Node | null;
              let targetNode: Text | null = null;
              let offsetInNode = 0;

              while ((node = walker.nextNode())) {
                const textNode = node as Text;
                const nodeLength = textNode.textContent?.length || 0;

                if (currentOffset + nodeLength >= insertPosition) {
                  targetNode = textNode;
                  offsetInNode = insertPosition - currentOffset;
                  break;
                }

                currentOffset += nodeLength;
              }

              if (targetNode) {
                const range = document.createRange();
                const finalOffset = Math.min(
                  offsetInNode,
                  targetNode.textContent?.length || 0
                );
                range.setStart(targetNode, finalOffset);
                range.setEnd(targetNode, finalOffset);
                selection.removeAllRanges();
                selection.addRange(range);
              }
            }

            // Фокусируем элемент
            editorRef.current.focus();
          } catch (e) {
            // Игнорируем ошибки восстановления курсора
          }
        } else if (
          editorRef.current instanceof HTMLTextAreaElement ||
          editorRef.current instanceof HTMLInputElement
        ) {
          editorRef.current.value = newText;
          editorRef.current.focus();
          editorRef.current.setSelectionRange(insertPosition, insertPosition);
          // Вызываем событие input
          editorRef.current.dispatchEvent(
            new Event("input", { bubbles: true })
          );
        }
      }
    }, 0);
  };

  // Получаем отсортированную историю
  const sortedHistory = getSortedHistory();

  // Фильтруем историю, убирая уже присутствующие хештеги
  const availableHistory = sortedHistory.filter(
    (item) => !currentHashtags.includes(item.tag)
  );

  if (currentHashtags.length === 0 && availableHistory.length === 0) {
    return null;
  }

  return (
    <div className="markdown-editor-hashtags">
      {/* Текущие хештеги */}
      {currentHashtags.length > 0 && (
        <div className="hashtags-current">
          <div className="hashtags-label">Хештеги в тексте:</div>
          <div className="hashtags-list">
            {currentHashtags.map((tag, index) => (
              <div key={index} className="hashtag-item hashtag-item--current">
                <span className="hashtag-text">{tag}</span>
                <button
                  type="button"
                  className="hashtag-remove"
                  onClick={() => removeHashtag(tag)}
                  title="Удалить хештег"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* История хештегов */}
      {availableHistory.length > 0 && (
        <div className="hashtags-history">
          <div className="hashtags-label">История хештегов:</div>
          <div className="hashtags-list">
            {availableHistory.map((item) => (
              <button
                key={item.tag}
                type="button"
                className="hashtag-item hashtag-item--history"
                onClick={() => insertHashtag(item.tag)}
                title="Добавить хештег"
              >
                <span className="hashtag-text">{item.tag}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Hashtags;
