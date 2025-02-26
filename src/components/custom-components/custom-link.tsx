import React from "react";
import { Link, useLocation } from "react-router-dom";
import { settings } from "../../settings";

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
  const linkClass = isActive ? `nav-link-active` : "text-gray-600";

  return (
    <Link
      className={`${className} nav-link ${linkClass} relative z-10 px-4`}
      to={to}
      style={
        isActive
          ? {
              color: settings.navigator["text-active-color"],
            }
          : {
              color: settings.navigator["text-inactive-color"],
            }
      }
    >
      {children}
    </Link>
  );
};

export default CustomNavLink;
