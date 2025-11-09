import { useState, useEffect, useCallback, useRef } from "react";

const HASHTAGS_HISTORY_KEY = "markdown-editor-hashtags-history";
const MAX_HISTORY_SIZE = 50;
const HASHTAG_HISTORY_DEBOUNCE_MS = 300;

interface HashtagHistoryItem {
  tag: string;
  lastUsed: number;
  count: number;
}

/**
 * Хук для работы с историей хештегов в localStorage
 * 
 * Примечание: localStorage используется для хранения истории хештегов.
 * Если нужна синхронизация между устройствами, лучше хранить на сервере
 * в профиле пользователя и синхронизировать через API.
 */
export const useHashtagsHistory = () => {
  const [history, setHistory] = useState<HashtagHistoryItem[]>([]);
  const pendingTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Загружаем историю при монтировании
  useEffect(() => {
    try {
      const stored = localStorage.getItem(HASHTAGS_HISTORY_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as HashtagHistoryItem[];
        setHistory(parsed);
      }
    } catch (error) {
      console.error("Ошибка загрузки истории хештегов:", error);
    }
  }, []);

  // Сохраняем историю в localStorage
  const persistHistory = useCallback((newHistory: HashtagHistoryItem[]) => {
    try {
      localStorage.setItem(HASHTAGS_HISTORY_KEY, JSON.stringify(newHistory));
    } catch (error) {
      console.error("Ошибка сохранения истории хештегов:", error);
    }
  }, []);

  const clearPendingTimer = useCallback((normalizedTag: string) => {
    const timers = pendingTimersRef.current;
    if (timers[normalizedTag]) {
      clearTimeout(timers[normalizedTag]);
      delete timers[normalizedTag];
    }
  }, []);

  const cancelAllPendingTimers = useCallback(() => {
    const timers = pendingTimersRef.current;
    Object.keys(timers).forEach((key) => {
      clearTimeout(timers[key]);
      delete timers[key];
    });
  }, []);

  useEffect(() => {
    return () => {
      cancelAllPendingTimers();
    };
  }, [cancelAllPendingTimers]);

  const updateHistoryWithTag = useCallback(
    (normalizedTag: string) => {
      setHistory((prev) => {
        const existingIndex = prev.findIndex((item) => item.tag === normalizedTag);
        let newHistory: HashtagHistoryItem[];

        if (existingIndex !== -1) {
          // Обновляем существующий хештег
          newHistory = [...prev];
          newHistory[existingIndex] = {
            ...newHistory[existingIndex],
            lastUsed: Date.now(),
            count: newHistory[existingIndex].count + 1,
          };
        } else {
          // Добавляем новый хештег
          newHistory = [
            ...prev,
            {
              tag: normalizedTag,
              lastUsed: Date.now(),
              count: 1,
            },
          ];
        }

        // Сортируем по дате использования (новые первыми) и ограничиваем размер
        newHistory.sort((a, b) => b.lastUsed - a.lastUsed);
        if (newHistory.length > MAX_HISTORY_SIZE) {
          newHistory = newHistory.slice(0, MAX_HISTORY_SIZE);
        }

        persistHistory(newHistory);
        return newHistory;
      });
    },
    [persistHistory]
  );

  // Добавляем хештег в историю с debounce
  const clearRelatedPendingTimers = useCallback(
    (normalizedTag: string) => {
      const timers = pendingTimersRef.current;
      Object.keys(timers).forEach((key) => {
        if (
          key === normalizedTag ||
          key.startsWith(normalizedTag) ||
          normalizedTag.startsWith(key)
        ) {
          clearPendingTimer(key);
        }
      });
    },
    [clearPendingTimer]
  );

  const addToHistory = useCallback(
    (tag: string) => {
      const normalizedTag = tag.toLowerCase();

      // Сбрасываем таймеры для текущего хештега и связанных префиксов,
      // чтобы не сохранять каждую промежуточную версию при вводе
      clearRelatedPendingTimers(normalizedTag);

      pendingTimersRef.current[normalizedTag] = setTimeout(() => {
        updateHistoryWithTag(normalizedTag);
        clearPendingTimer(normalizedTag);
      }, HASHTAG_HISTORY_DEBOUNCE_MS);
    },
    [clearPendingTimer, clearRelatedPendingTimers, updateHistoryWithTag]
  );

  // Удаляем хештег из истории
  const removeFromHistory = useCallback((tag: string) => {
    const normalizedTag = tag.toLowerCase();
    clearPendingTimer(normalizedTag);
    setHistory((prev) => {
      const newHistory = prev.filter((item) => item.tag !== normalizedTag);
      persistHistory(newHistory);
      return newHistory;
    });
  }, [clearPendingTimer, persistHistory]);

  // Очищаем историю
  const clearHistory = useCallback(() => {
    cancelAllPendingTimers();
    setHistory([]);
    persistHistory([]);
  }, [cancelAllPendingTimers, persistHistory]);

  // Получаем отсортированную историю (по частоте использования и дате)
  const getSortedHistory = useCallback(() => {
    return [...history].sort((a, b) => {
      // Сначала по количеству использований
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      // Потом по дате
      return b.lastUsed - a.lastUsed;
    });
  }, [history]);

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory,
    getSortedHistory,
  };
};

