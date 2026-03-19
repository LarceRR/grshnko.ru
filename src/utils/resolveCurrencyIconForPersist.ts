import { EmojiStyle } from "emoji-picker-react";
import { currencyApi } from "../api/currencies";
import {
  currencyEmojiDatasourceUrl,
  isCurrencyEmojiUnifiedStorage,
} from "./currencyEmojiAsset";

type IconType = "emoji" | "lucide" | "url";

/**
 * Before create/update: if the user picked an emoji from the grid (unified id),
 * upload the Apple PNG to our CDN and switch to url + filename.
 */
export async function resolveCurrencyIconForPersist(
  icon: string | undefined | null,
  iconType: IconType,
): Promise<{ icon: string; iconType: IconType }> {
  const i = icon?.trim() ?? "";
  if (iconType === "emoji" && i && isCurrencyEmojiUnifiedStorage(i)) {
    const srcUrl = currencyEmojiDatasourceUrl(i, EmojiStyle.APPLE);
    const { filename } = await currencyApi.uploadIconFromUrl(srcUrl);
    return { icon: filename, iconType: "url" };
  }
  return { icon: i, iconType };
}
