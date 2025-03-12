import React from "react";
import "./custom-checkbox.scss"; // Импортируем стили
import { Check } from "lucide-react";

interface CheckboxProps {
  checked: boolean;
  className?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  style?: React.CSSProperties;
  disabled?: boolean;
  children?: React.ReactNode; // Добавляем поддержку children
}

const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  className,
  onChange,
  style,
  disabled,
  children,
}) => {
  return (
    <label className={`custom-checkbox-label ${className}`} style={style}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        style={{
          opacity: disabled ? 0.5 : 1,
          pointerEvents: disabled ? "none" : "auto",
          cursor: disabled ? "not-allowed" : "pointer",
        }}
        className="custom-checkbox-input"
      />
      <span className="custom-checkbox-checkmark"> {checked && <Check />}</span>
      {children}
    </label>
  );
};

export default Checkbox;
