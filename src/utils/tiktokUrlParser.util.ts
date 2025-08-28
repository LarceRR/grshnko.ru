/**
 * Extracts the TikTok username (with the leading `@`) and the channel URL
 * (everything up to `/video/`) from a full TikTok video link.
 *
 * @param  url  The full URL of a TikTok video.
 * @returns A string containing the username and channel link separated by a pipe (`|`).
 *
 * @example
 * const info = getChannelInfo(
 *   'https://www.tiktok.com/@gerashenko_/video/7040865539949956353?is_from_webapp=1&sender_device=pc'
 * );
 * // => {
 *  username: "@gerashenko_"
 *  channelUrl: "https://www.tiktok.com/@gerashenko_"
 * }
 */

import { IChannelInfo } from "../types/tiktok";

export const getChannelInfo = (data: any): IChannelInfo => {
  try {
    // console.log(data)
    const { origin, pathname } = new URL(data.url);
    // Remove empty segments and join back the path parts
    const pathSegments = pathname.split("/").filter(Boolean);

    // The first segment after the domain is always the username (e.g. "@gerashenko_")
    const username = pathSegments[0] ?? "";
    // Build the channel link (everything up to the `/video/` section)
    const channelLink = `${origin}/${username}`;

    return {
        username: username,
        channelUrl: channelLink,
        fullUrl: data.fullUrl,
        description: data.description
    };
  } catch {
    // If an invalid URL is passed, return empty string
    return {
        error: 'Не удалось извлечь данные о тикток канале.'
    };
  }
};