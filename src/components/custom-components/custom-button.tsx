import React from "react";
import { Button as AntDButton } from "antd";

interface IButtonProps {
  onClick?: () => void;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  loading?: boolean;
  error?: string;
  icon?: React.ReactNode;
  type?: "default" | "primary" | "ghost" | "dashed" | "link" | "text";
}

const Button: React.FC<IButtonProps> = ({
  onClick,
  children,
  className,
  style,
  disabled,
  loading,
  error,
  type,
  icon,
  ...props
}) => {
  return (
    <AntDButton
      onClick={onClick}
      className={className}
      style={{
        ...style,
        backgroundColor: error ? "red" : "var(--button-primary-bg)!important",
        opacity: disabled ? 0.5 : 1,
        paddingInline: "15px",
      }}
      disabled={disabled}
      loading={loading}
      icon={icon}
      {...props}
    >
      {children}
    </AntDButton>
  );
};

export default Button;
