import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import CustomNavLink from "../custom-components/custom-link";
import { Switch } from "antd";
import "./Navigator.scss";
import useTheme from "../../hooks/useTheme";

const Navbar: React.FC = () => {
  const [underlineStyle, setUnderlineStyle] = useState({
    left: "0px",
    width: "0px",
  });
  const location = useLocation();
  const underlineRef = useRef<HTMLDivElement>(null);

  const [theme, toggleTheme] = useTheme();

  useEffect(() => {
    const activeLink = document.querySelector(".nav-link-active");

    if (activeLink && underlineRef.current) {
      const rect = activeLink.getBoundingClientRect();
      const parentRect = (
        activeLink as HTMLElement
      ).offsetParent?.getBoundingClientRect() || { left: 0 };

      setUnderlineStyle({
        left: `${rect.left - parentRect.left}px`,
        width: `${rect.width}px`,
      });
    }
  }, [location.pathname]);

  return (
    <nav className="navigator-wrapper">
      <div className="navigator-links">
        <CustomNavLink to="/">Telegram Autopost CRM</CustomNavLink>
        <CustomNavLink to="/other">Other future shit</CustomNavLink>
      </div>
      <Switch
        defaultChecked
        checkedChildren={theme}
        unCheckedChildren={theme}
        onChange={toggleTheme}
      />

      {/* Подчёркивание */}
      <div
        ref={underlineRef}
        className="navigator-underline"
        style={{
          left: underlineStyle.left,
          width: underlineStyle.width,
        }}
      />
    </nav>
  );
};

export default Navbar;
