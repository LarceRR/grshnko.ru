export const getEmojiUrl = (emoji: string) => {
    const unicode = emoji.codePointAt(0)?.toString(16)

    return unicode
    ? `https://cdn.jsdelivr.net/gh/joypixels/emoji-assets/png/64/${unicode}.png`
    : null;
};