import React from "react";
import { Link, useLocation } from "react-router-dom";

interface ICustomLinkProps {
  children: React.ReactNode;
  to: string;
  className?: string;
}

const CustomNavLink: React.FC<ICustomLinkProps> = ({
  children,
  to,
  className = "",
}) => {
  const location = useLocation();
  const isActive =
    to === "/" ? location.pathname === to : location.pathname.startsWith(to);
  const linkClass = isActive ? `nav-link-active` : "";

  return (
    <Link
      className={`${className} nav-link ${linkClass} relative z-10 px-4`}
      to={to}
    >
      {children}
    </Link>
  );
};

export default CustomNavLink;
