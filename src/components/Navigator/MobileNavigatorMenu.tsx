import { Ellipsis, Home } from "lucide-react";
import CustomNavLink from "../custom-components/custom-link";

export interface IMenuItem {
  label: React.ReactNode;
  key: string;
}

export const items = [
  {
    label: (
      <CustomNavLink to="/">
        <Home size={26} />
        <span>TA CRM</span>
      </CustomNavLink>
    ),
    key: "0",
  },
  {
    label: (
      <CustomNavLink to="/other">
        <Ellipsis size={26} />
        <span>Другое</span>
      </CustomNavLink>
    ),
    key: "1",
  },
];
