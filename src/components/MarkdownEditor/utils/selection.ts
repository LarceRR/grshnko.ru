/**
 * Получает offset в plain text из Selection Range
 * Корректно обрабатывает переносы строк (Enter)
 * Использует innerText для получения текста (как в основном коде)
 */
export const getTextOffsetFromRange = (
  range: Range,
  container: HTMLElement
): { start: number; end: number } => {
  // Сохраняем текущий selection для восстановления после манипуляций
  const selection = window.getSelection();
  const savedRange = selection && selection.rangeCount > 0 
    ? selection.getRangeAt(0).cloneRange() 
    : null;

  try {
    // Создаем временный контейнер с теми же стилями для правильного отображения
    const tempContainer = document.createElement("div");
    // Копируем стили, которые могут влиять на innerText (особенно white-space)
    const containerStyle = window.getComputedStyle(container);
    tempContainer.style.cssText = containerStyle.cssText;
    
    // Метод 1: Создаем range от начала контейнера до начала выделения
    const startRange = document.createRange();
    startRange.selectNodeContents(container);
    startRange.setEnd(range.startContainer, range.startOffset);
    
    // Клонируем содержимое до начала выделения
    const startFragment = startRange.cloneContents();
    tempContainer.innerHTML = "";
    tempContainer.appendChild(startFragment);
    
    // Получаем текст через innerText (как в основном коде)
    // Это гарантирует правильную обработку переносов строк
    const startText = tempContainer.innerText || "";
    const start = startText.length;

    // Метод 2: Создаем range от начала контейнера до конца выделения
    const endRange = document.createRange();
    endRange.selectNodeContents(container);
    endRange.setEnd(range.endContainer, range.endOffset);
    
    // Клонируем содержимое до конца выделения
    const endFragment = endRange.cloneContents();
    tempContainer.innerHTML = "";
    tempContainer.appendChild(endFragment);
    
    // Получаем текст через innerText
    const endText = tempContainer.innerText || "";
    const end = endText.length;

    return { start, end };
  } finally {
    // Восстанавливаем selection, если он был
    if (savedRange && selection) {
      try {
        selection.removeAllRanges();
        selection.addRange(savedRange);
      } catch (e) {
        // Игнорируем ошибки при восстановлении selection
      }
    }
  }
};

