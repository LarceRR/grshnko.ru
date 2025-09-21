import React, { useEffect, useState } from "react";
import CustomNavLink from "../custom-components/custom-link";
import "./Navigator.scss";
import { useWindowSize } from "../../hooks/useWindowSize";
import { useMenuItems } from "./MobileNavigatorMenu";
import NavUser from "./NavUser/NavUser";
import { useHttpTracker } from "../../hooks/useHttpTracker"; // импортируем трекер запросов

const Navbar: React.FC = () => {
  const { size } = useWindowSize();
  const items = useMenuItems();
  const requests = useHttpTracker();
  const [borderColor, setBorderColor] = useState<string | null>(null);

  // Следим за последним запросом
  useEffect(() => {
    if (requests.length === 0) return;

    const lastRequest = requests[requests.length - 1];
    if (lastRequest.status !== "success" && lastRequest.status !== "error")
      return;

    // задаём цвет
    setBorderColor(lastRequest.status === "success" ? "green" : "red");

    // таймер для сброса
    const timer = setTimeout(() => setBorderColor(null), 3000);

    // очищаем таймер при новом effect
    return () => clearTimeout(timer);
  }, [requests]);

  if (size[0] > 1028) {
    return (
      <nav className="navigator-wrapper">
        <div className="navigator-links">
          <CustomNavLink to="/">Telegram Autopost CRM</CustomNavLink>
        </div>
        <NavUser />
      </nav>
    );
  } else {
    return (
      // Здесь добавляем border на основе состояния
      <div className="navigator-wrapper">
        <nav
          style={{
            outline: borderColor
              ? `0.5px solid ${borderColor}`
              : "0.5px solid var(--border-color)",
            transition: "all 0.3s ease",
          }}
        >
          {items.map(
            (item) => item.enabled && <div key={item.key}>{item.label}</div>
          )}
        </nav>
      </div>
    );
  }
};

export default Navbar;
