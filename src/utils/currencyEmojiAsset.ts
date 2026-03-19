import { EmojiStyle } from "emoji-picker-react";

/** Stored icon is unified id (e.g. `1f44d-1f3fb`), not a literal emoji character. */
const UNIFIED_STORAGE_RE = /^[0-9a-f]{2,}(-[0-9a-f]+)*$/i;

const CDN_BY_STYLE: Record<Exclude<EmojiStyle, EmojiStyle.NATIVE>, string> = {
  [EmojiStyle.APPLE]:
    "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/",
  [EmojiStyle.GOOGLE]:
    "https://cdn.jsdelivr.net/npm/emoji-datasource-google/img/google/64/",
  [EmojiStyle.FACEBOOK]:
    "https://cdn.jsdelivr.net/npm/emoji-datasource-facebook/img/facebook/64/",
  [EmojiStyle.TWITTER]:
    "https://cdn.jsdelivr.net/npm/emoji-datasource-twitter/img/twitter/64/",
};

export function isCurrencyEmojiUnifiedStorage(icon: string): boolean {
  return UNIFIED_STORAGE_RE.test(icon.trim());
}

/** PNG URL matching emoji-picker-react / emoji-datasource (same as grid preview). */
export function currencyEmojiDatasourceUrl(
  unified: string,
  style: Exclude<EmojiStyle, EmojiStyle.NATIVE> = EmojiStyle.APPLE,
): string {
  const u = unified.trim().toLowerCase();
  return `${CDN_BY_STYLE[style]}${u}.png`;
}
