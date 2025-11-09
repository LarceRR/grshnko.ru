import { useState, useCallback } from "react";
import { HistoryState } from "../types";

export const useHistory = () => {
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const pushHistory = useCallback((text: string, entities: HistoryState["entities"]) => {
    setHistory((prevHistory) => {
      const newHistory = prevHistory.slice(0, historyIndex + 1);
      return [...newHistory, { text, entities }];
    });
    setHistoryIndex((prevIndex) => prevIndex + 1);
  }, [historyIndex]);

  const undo = useCallback((): HistoryState | null => {
    if (historyIndex <= 0) return null;
    const prevState = history[historyIndex - 1];
    setHistoryIndex((prevIndex) => prevIndex - 1);
    return prevState;
  }, [history, historyIndex]);

  const redo = useCallback((): HistoryState | null => {
    if (historyIndex >= history.length - 1) return null;
    const nextState = history[historyIndex + 1];
    setHistoryIndex((prevIndex) => prevIndex + 1);
    return nextState;
  }, [history, historyIndex]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setHistoryIndex(-1);
  }, []);

  return {
    history,
    historyIndex,
    pushHistory,
    undo,
    redo,
    clearHistory,
  };
};

