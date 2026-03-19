import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { currencyApi } from "../../api/currencies";
import { useUser } from "../../hooks/useUser";
import { CurrencyIcon } from "./CurrencyIcon";
import type { UserCurrencyBalance } from "../../types/currency";
import type { UserCurrencyBalanceInline } from "../../types/user";
import "./CurrencyDisplay.scss";

interface CurrencyDisplayProps {
  userId?: string;
  /** Pre-loaded balances from the user object — skips the network request */
  inlineBalances?: UserCurrencyBalanceInline[];
  hideCurrencyName?: boolean;
  compact?: boolean;
  className?: string;
}

const LONG_PRESS_MS = 500;

function inlineToDisplay(
  items: UserCurrencyBalanceInline[],
): UserCurrencyBalance[] {
  return items.map((b) => ({
    id: b.currency.id,
    name: b.currency.name,
    slug: b.currency.slug,
    description: b.currency.description,
    icon: b.currency.icon,
    iconType: b.currency.iconType,
    iconColor: b.currency.iconColor,
    isMain: b.currency.isMain,
    createdAt: b.currency.createdAt,
    updatedAt: b.currency.updatedAt,
    amount: b.amount,
    isHidden: false,
    isHiddenForOthers: false,
  }));
}

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  userId: propUserId,
  inlineBalances,
  hideCurrencyName,
  compact,
  className,
}) => {
  const navigate = useNavigate();
  const { user } = useUser();
  const targetUserId = propUserId || user?.id;
  const [activeIndex, setActiveIndex] = useState(0);
  const [contextOpen, setContextOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: fetchedBalances = [] } = useQuery<UserCurrencyBalance[]>({
    queryKey: ["user-currencies", targetUserId],
    queryFn: () => currencyApi.getUserCurrencies(targetUserId!),
    enabled: !!targetUserId && !inlineBalances,
    staleTime: 30_000,
  });

  const balances = useMemo(
    () => (inlineBalances ? inlineToDisplay(inlineBalances) : fetchedBalances),
    [inlineBalances, fetchedBalances],
  );

  const mainIndex = balances.findIndex((b) => b.isMain);
  const effectiveIndex = activeIndex < balances.length ? activeIndex : 0;

  useEffect(() => {
    if (mainIndex >= 0 && activeIndex === 0) {
      setActiveIndex(mainIndex);
    }
  }, [mainIndex]);

  const current = balances[effectiveIndex];

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (balances.length <= 1) return;
      setActiveIndex((i) => (i + 1) % balances.length);
    },
    [balances.length],
  );

  const handleMouseDown = useCallback(() => {
    longPressTimer.current = setTimeout(() => {
      setContextOpen(true);
    }, LONG_PRESS_MS);
  }, []);

  const handleMouseUp = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuPos({ x: e.clientX, y: e.clientY });
    setContextOpen(true);
  }, []);

  useEffect(() => {
    if (!contextOpen) return;
    const close = () => setContextOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [contextOpen]);

  if (!current) return null;
  if (current.amount === null) return null;

  return (
    <div
      ref={containerRef}
      className={`currency-display${compact ? " currency-display--compact" : ""} ${className || ""}`}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleMouseDown}
      onTouchEnd={handleMouseUp}
      onContextMenu={handleContextMenu}
      role="button"
      tabIndex={0}
    >
      <CurrencyIcon
        icon={current.icon}
        iconType={current.iconType}
        iconColor={current.iconColor}
        size={compact ? 16 : 18}
      />
      {!hideCurrencyName && (
        <span className="currency-display__name">{current.name}</span>
      )}
      <span className="currency-display__amount">
        {current.amount.toLocaleString()}
      </span>

      {contextOpen && (
        <div
          className="currency-display__context-menu"
          style={{ position: "fixed", left: menuPos.x, top: menuPos.y }}
        >
          {balances.map((b) => (
            <div
              key={b.id}
              className="currency-display__context-item"
              onClick={(e) => {
                e.stopPropagation();
                setContextOpen(false);
                navigate("/currency-get");
              }}
            >
              <CurrencyIcon
                icon={b.icon}
                iconType={b.iconType}
                iconColor={b.iconColor}
                size={16}
              />
              <span>{b.name}</span>
              {b.amount !== null && (
                <span className="currency-display__context-amount">
                  {b.amount.toLocaleString()}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
