import React from "react";
import CustomNavLink from "../custom-components/custom-link";
import { Switch } from "antd";
import "./Navigator.scss";
import useTheme from "../../hooks/useTheme";
import { useWindowSize } from "../../hooks/useWindowSize";
import { IMenuItem, items } from "./MobileNavigatorMenu";

const Navbar: React.FC = () => {
  const { size } = useWindowSize();

  const [theme, toggleTheme] = useTheme();

  if (size[0] > 1028) {
    return (
      <nav className="navigator-wrapper">
        <div className="navigator-links">
          <CustomNavLink to="/">Telegram Autopost CRM</CustomNavLink>
          <CustomNavLink to="/other">Other future shit</CustomNavLink>
          {/* {size[0]} */}
        </div>
        <Switch
          defaultChecked
          checkedChildren={theme}
          unCheckedChildren={theme}
          onChange={toggleTheme}
        />
      </nav>
    );
  } else {
    // console.log(items);
    return (
      <nav className="navigator-wrapper">
        {items.map((item: IMenuItem) => (
          <div key={item.key}>{item.label}</div>
        ))}
      </nav>
    );
  }
};

export default Navbar;
