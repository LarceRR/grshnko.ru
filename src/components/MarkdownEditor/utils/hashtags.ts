/**
 * Регулярное выражение для поиска хештегов
 * Формат: #hashtag (латиница, кириллица, цифры, подчеркивания)
 */
export const HASHTAG_REGEX = /#[\wа-яёА-ЯЁ]+/gi;

/**
 * Регулярное выражение для поиска завершенных хештегов
 * Завершенный хештег - это тот, после которого идет пробел, перенос строки, конец текста или другой хештег
 */
export const COMPLETED_HASHTAG_REGEX = /#[\wа-яёА-ЯЁ]+(?=\s|$|\n|#)/gi;

/**
 * Извлекает все хештеги из текста
 */
export const extractHashtags = (text: string): string[] => {
  const matches = text.match(HASHTAG_REGEX);
  if (!matches) return [];
  
  // Убираем дубликаты и приводим к нижнему регистру для уникальности
  const uniqueHashtags = Array.from(new Set(matches.map(tag => tag.toLowerCase())));
  return uniqueHashtags;
};

/**
 * Извлекает только завершенные хештеги из текста
 * Завершенный хештег - это тот, после которого идет пробел, перенос строки, конец текста или другой хештег
 */
export const extractCompletedHashtags = (text: string): string[] => {
  // Используем более точное регулярное выражение для завершенных хештегов
  // Хештег считается завершенным, если после него нет букв/цифр/подчеркиваний
  const regex = /#[\wа-яёА-ЯЁ]+(?=[\s\n#]|$)/gi;
  const matches = text.match(regex);
  if (!matches) return [];
  
  // Убираем дубликаты и приводим к нижнему регистру для уникальности
  const uniqueHashtags = Array.from(new Set(matches.map(tag => tag.toLowerCase())));
  return uniqueHashtags;
};

/**
 * Проверяет, есть ли хештеги в тексте
 */
export const hasHashtags = (text: string): boolean => {
  return HASHTAG_REGEX.test(text);
};

/**
 * Находит позицию последнего хештега в тексте
 * Возвращает индекс начала последнего хештега или -1
 */
export const findLastHashtagPosition = (text: string): number => {
  let lastIndex = -1;
  const regex = new RegExp(HASHTAG_REGEX);
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    lastIndex = match.index;
  }
  
  return lastIndex;
};

/**
 * Находит позицию конца последнего хештега в тексте
 * Возвращает индекс конца последнего хештега или -1
 */
export const findLastHashtagEndPosition = (text: string): number => {
  let lastEndIndex = -1;
  const regex = new RegExp(HASHTAG_REGEX);
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    lastEndIndex = match.index + match[0].length;
  }
  
  return lastEndIndex;
};

