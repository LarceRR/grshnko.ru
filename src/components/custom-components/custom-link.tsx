import React from "react";
import { Link, useLocation } from "react-router-dom";
import "../Navigator/Navigator.scss";

interface ICustomLinkProps {
  children: React.ReactNode;
  to: string;
  className?: string;
  highlight?: boolean;
  onClick?: () => void
}

const CustomNavLink: React.FC<ICustomLinkProps> = ({
  children,
  to,
  className = "",
  highlight = false,
  onClick
}) => {
  const location = useLocation();
  const isActive =
    to === "/" ? location.pathname === to : location.pathname.startsWith(to);
  const linkClass = isActive ? `nav-link-active` : highlight ? "highlight" : '';
  return (
    <Link
    onClick={onClick}
      className={`${className} nav-link ${linkClass} relative z-10 px-4`}
      to={to}
    >
      {children}
    </Link>
  );
};

export default CustomNavLink;
