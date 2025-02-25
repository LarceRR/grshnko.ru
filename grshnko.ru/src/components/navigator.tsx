import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import CustomNavLink from "./custom-components/custom-link";
import { settings } from "../settings";

const Navbar: React.FC = () => {
  const [underlineStyle, setUnderlineStyle] = useState({
    left: "0px",
    width: "0px",
  });
  const location = useLocation();
  const underlineRef = useRef<HTMLDivElement>(null);

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
    <nav className="relative flex gap-6 border-b p-4">
      <CustomNavLink to="/">TgCosmos</CustomNavLink>
      <CustomNavLink to="/other">Other</CustomNavLink>

      {/* Подчёркивание */}
      <div
        ref={underlineRef}
        className="absolute bottom-[7px] h-[40px] transition-all duration-300 ease-in-out"
        style={{
          left: underlineStyle.left,
          width: underlineStyle.width,
          backgroundColor: settings.navigator["underline-color"],
          borderRadius: settings.navigator["border-radius"],
        }}
      />
    </nav>
  );
};

export default Navbar;
