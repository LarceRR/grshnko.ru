import React from "react";
import CustomNavLink from "../custom-components/custom-link";
import "./Navigator.scss";
import { useWindowSize } from "../../hooks/useWindowSize";
import { IMenuItem, items } from "./MobileNavigatorMenu";
import NavUser from "./NavUser/NavUser";

const Navbar: React.FC = () => {
  const { size } = useWindowSize();

  // const [theme, toggleTheme] = useTheme();

  if (size[0] > 1028) {
    return (
      <nav className="navigator-wrapper">
        <div className="navigator-links">
          <CustomNavLink to="/">Telegram Autopost CRM</CustomNavLink>
          <CustomNavLink to="/other">Other future page</CustomNavLink>
          {/* {size[0]} */}
        </div>
        <NavUser />
      </nav>
    );
  } else {
    // console.log(items);
    return (
      <div className="navigator-wrapper">
        <nav>
          {items.map((item: IMenuItem) => (
            <div key={item.key}>{item.label}</div>
          ))}
        </nav>
      </div>
    );
  }
};

export default Navbar;
