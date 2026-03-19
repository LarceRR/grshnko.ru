import React from "react";
import { EmojiStyle } from "emoji-picker-react";
import { icons as lucideIconsMap } from "lucide-react";
import { API_URL } from "../../config";
import {
  currencyEmojiDatasourceUrl,
  isCurrencyEmojiUnifiedStorage,
} from "../../utils/currencyEmojiAsset";

interface CurrencyIconProps {
  icon?: string | null;
  iconType: "emoji" | "lucide" | "url";
  iconColor?: string | null;
  size?: number;
  className?: string;
  /** For icons stored as unified ids — same sprite set as in the picker (default Apple). */
  emojiDatasourceStyle?: Exclude<EmojiStyle, EmojiStyle.NATIVE>;
}

export const CurrencyIcon: React.FC<CurrencyIconProps> = ({
  icon,
  iconType,
  iconColor,
  size = 20,
  className,
  emojiDatasourceStyle = EmojiStyle.APPLE,
}) => {
  if (!icon) {
    return (
      <span style={{ fontSize: size }} className={className}>
        💰
      </span>
    );
  }

  if (iconType === "emoji") {
    if (isCurrencyEmojiUnifiedStorage(icon)) {
      return (
        <img
          src={currencyEmojiDatasourceUrl(icon, emojiDatasourceStyle)}
          alt=""
          width={size}
          height={size}
          draggable={false}
          className={className}
          style={{
            objectFit: "contain",
            display: "inline-block",
            verticalAlign: "middle",
          }}
        />
      );
    }
    return (
      <span style={{ fontSize: size, lineHeight: 1 }} className={className}>
        {icon}
      </span>
    );
  }

  if (iconType === "lucide") {
    const pascalName = icon
      .split("-")
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join("");
    const LucideIcon =
      lucideIconsMap[pascalName as keyof typeof lucideIconsMap];
    if (LucideIcon) {
      return (
        <LucideIcon
          size={size}
          style={iconColor ? { color: iconColor } : undefined}
        />
      );
    }
    return (
      <span style={{ fontSize: size }} className={className}>
        💰
      </span>
    );
  }

  if (iconType === "url") {
    return (
      <img
        src={`${API_URL}cdn/currency-icon/${icon}`}
        alt=""
        width={size}
        height={size}
        style={{ borderRadius: 4, objectFit: "contain" }}
        className={className}
      />
    );
  }

  return <span style={{ fontSize: size }}>💰</span>;
};
