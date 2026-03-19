import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { Input, Button, Slider, message } from "antd";
import {
  X,
  ArrowLeft,
  Link2,
  Smile,
  icons as lucideIconsMap,
} from "lucide-react";
import { useInView } from "react-intersection-observer";
import EmojiPicker, { Theme, EmojiStyle } from "emoji-picker-react";
import emojiRu from "emoji-picker-react/dist/data/emojis-ru";
import { CurrencyIcon } from "../CurrencyDisplay/CurrencyIcon";
import { currencyApi } from "../../api/currencies";
import "./IconPicker.scss";

interface IconPickerProps {
  value: string;
  iconType: string;
  iconColor?: string;
  onChange: (icon: string, iconType: "emoji" | "lucide" | "url") => void;
  onColorChange?: (color: string) => void;
  size?: number;
}

type Tab = "emoji" | "lucide" | "url";

const PRESET_COLORS = [
  "#6366F1",
  "#3B82F6",
  "#06B6D4",
  "#10B981",
  "#22C55E",
  "#EAB308",
  "#F59E0B",
  "#F97316",
  "#EF4444",
  "#EC4899",
  "#A855F7",
  "#8B5CF6",
  "#64748B",
  "#FFFFFF",
];

const ALL_LUCIDE_ICONS = Object.keys(lucideIconsMap).sort();
const CHUNK_SIZE = 80;

function VirtualGrid({
  items,
  renderItem,
}: {
  items: string[];
  renderItem: (item: string) => React.ReactNode;
}) {
  const [visibleCount, setVisibleCount] = useState(CHUNK_SIZE);
  const { ref: sentinelRef, inView } = useInView({ threshold: 0 });

  useEffect(() => {
    if (inView && visibleCount < items.length) {
      setVisibleCount((c) => Math.min(c + CHUNK_SIZE, items.length));
    }
  }, [inView, items.length]);

  useEffect(() => {
    setVisibleCount(CHUNK_SIZE);
  }, [items]);

  return (
    <div className="icon-picker__grid">
      {items.slice(0, visibleCount).map((item) => (
        <React.Fragment key={item}>{renderItem(item)}</React.Fragment>
      ))}
      {visibleCount < items.length && (
        <div ref={sentinelRef} className="icon-picker__sentinel" />
      )}
    </div>
  );
}

export const IconPicker: React.FC<IconPickerProps> = ({
  value,
  iconType,
  iconColor,
  onChange,
  onColorChange,
  size = 32,
}) => {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("emoji");
  const [search, setSearch] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [urlPreview, setUrlPreview] = useState<string | null>(null);
  const [urlEditing, setUrlEditing] = useState(false);
  const [iconSize, setIconSize] = useState(128);
  const [uploading, setUploading] = useState(false);
  const [selectedColor, setSelectedColor] = useState(iconColor || "#FFFFFF");
  const popupRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (iconColor) setSelectedColor(iconColor);
  }, [iconColor]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const filteredLucideIcons = useMemo(() => {
    if (!search.trim()) return ALL_LUCIDE_ICONS;
    const q = search.toLowerCase();
    return ALL_LUCIDE_ICONS.filter((name) => name.toLowerCase().includes(q));
  }, [search]);

  const handleLucideClick = useCallback(
    (name: string) => {
      const kebab = name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
      onChange(kebab, "lucide");
      if (onColorChange) onColorChange(selectedColor);
      setOpen(false);
    },
    [onChange, onColorChange, selectedColor],
  );

  const handleColorSelect = useCallback(
    (color: string) => {
      setSelectedColor(color);
      if (onColorChange) onColorChange(color);
    },
    [onColorChange],
  );

  const handleUrlLoad = useCallback(() => {
    if (!urlInput.trim()) return;
    setUrlPreview(urlInput.trim());
    setUrlEditing(true);
  }, [urlInput]);

  const handleUrlConfirm = useCallback(async () => {
    if (!urlPreview) return;
    setUploading(true);
    try {
      const { filename } = await currencyApi.uploadIconFromUrl(urlPreview);
      onChange(filename, "url");
      setOpen(false);
      setUrlEditing(false);
      setUrlInput("");
      setUrlPreview(null);
    } catch {
      message.error("Не удалось загрузить изображение");
    } finally {
      setUploading(false);
    }
  }, [urlPreview, iconSize, onChange]);

  const handleEmojiPick = useCallback(
    (unified: string) => {
      onChange(unified.toLowerCase(), "emoji");
      setOpen(false);
    },
    [onChange],
  );

  return (
    <div className="icon-picker-wrapper">
      <button
        ref={triggerRef}
        className="icon-picker__trigger"
        onClick={() => setOpen((o) => !o)}
        type="button"
      >
        <CurrencyIcon
          icon={value}
          iconType={iconType as "emoji" | "lucide" | "url"}
          iconColor={iconColor}
          size={size}
          emojiDatasourceStyle={EmojiStyle.APPLE}
        />
      </button>

      {open && (
        <div
          ref={popupRef}
          className={`icon-picker${tab === "emoji" ? " icon-picker--emoji-tab" : ""}`}
        >
          <div className="icon-picker__tabs">
            <button
              className={`icon-picker__tab${tab === "emoji" ? " active" : ""}`}
              onClick={() => {
                setTab("emoji");
                setSearch("");
              }}
            >
              <Smile size={16} /> Emoji
            </button>
            <button
              className={`icon-picker__tab${tab === "url" ? " active" : ""}`}
              onClick={() => {
                setTab("url");
                setSearch("");
              }}
            >
              <Link2 size={16} /> URL
            </button>
            <button
              className={`icon-picker__tab${tab === "lucide" ? " active" : ""}`}
              onClick={() => {
                setTab("lucide");
                setSearch("");
              }}
            >
              Lucide
            </button>
          </div>

          {tab === "lucide" && (
            <Input
              placeholder={"Поиск иконки Lucide…"}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
              className="icon-picker__search"
              size="small"
            />
          )}

          {tab === "lucide" && (
            <div className="icon-picker__color-row">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  className={`icon-picker__color-swatch${selectedColor === c ? " active" : ""}`}
                  style={{ background: c }}
                  onClick={() => handleColorSelect(c)}
                  title={c}
                />
              ))}
              <input
                type="color"
                className="icon-picker__color-custom"
                value={selectedColor}
                onChange={(e) => handleColorSelect(e.target.value)}
                title="Свой цвет"
              />
            </div>
          )}

          <div className="icon-picker__content">
            {tab === "emoji" && (
              <div className="icon-picker__emoji-wrap">
                <EmojiPicker
                  emojiData={emojiRu}
                  onEmojiClick={(data) => handleEmojiPick(data.unified)}
                  reactionsDefaultOpen={false}
                  allowExpandReactions={false}
                  lazyLoadEmojis={false}
                  theme={Theme.AUTO}
                  emojiStyle={EmojiStyle.APPLE}
                  width="100%"
                  height={420}
                  searchPlaceholder="Поиск…"
                  className="icon-picker__emoji-picker-root"
                />
              </div>
            )}

            {tab === "lucide" && (
              <VirtualGrid
                items={filteredLucideIcons}
                renderItem={(name) => {
                  const Icon =
                    lucideIconsMap[name as keyof typeof lucideIconsMap];
                  if (!Icon) return null;
                  const kebab = name
                    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
                    .toLowerCase();
                  return (
                    <button
                      className={`icon-picker__cell icon-picker__cell--lucide${value === kebab && iconType === "lucide" ? " selected" : ""}`}
                      onClick={() => handleLucideClick(name)}
                      title={name}
                    >
                      <Icon size={20} style={{ color: selectedColor }} />
                    </button>
                  );
                }}
              />
            )}

            {tab === "url" && (
              <div
                className={`icon-picker__url-panel${urlEditing ? " icon-picker__url-panel--editing" : ""}`}
              >
                {!urlEditing ? (
                  <div className="icon-picker__url-input-wrapper">
                    <Input
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://example.com/icon.png"
                      suffix={
                        urlInput && (
                          <X
                            size={14}
                            className="icon-picker__url-clear"
                            onClick={() => setUrlInput("")}
                          />
                        )
                      }
                      onPressEnter={handleUrlLoad}
                    />
                    <Button
                      type="primary"
                      size="small"
                      onClick={handleUrlLoad}
                      disabled={!urlInput.trim()}
                    >
                      Загрузить
                    </Button>
                  </div>
                ) : (
                  <div className="icon-picker__url-editor">
                    <button
                      className="icon-picker__url-back"
                      onClick={() => {
                        setUrlEditing(false);
                        setUrlPreview(null);
                      }}
                    >
                      <ArrowLeft size={16} /> Назад
                    </button>
                    {urlPreview && (
                      <div className="icon-picker__url-preview">
                        <img
                          src={urlPreview}
                          alt="Preview"
                          style={{
                            width: iconSize,
                            height: iconSize,
                            objectFit: "contain",
                          }}
                        />
                      </div>
                    )}
                    <div className="icon-picker__url-resize">
                      <span>Размер: {iconSize}px</span>
                      <Slider
                        min={16}
                        max={256}
                        value={iconSize}
                        onChange={setIconSize}
                      />
                    </div>
                    <Button
                      type="primary"
                      onClick={handleUrlConfirm}
                      loading={uploading}
                      block
                    >
                      Сохранить
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
