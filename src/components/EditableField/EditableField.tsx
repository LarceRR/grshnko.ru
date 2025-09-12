// EditableField.tsx
import React, { useState, useEffect } from "react";
import "./EditableField.scss";

const EditableField: React.FC<{
  label: string;
  value: any;
  style?: React.CSSProperties;
  onChange: (val: string) => void;
}> = ({ label, value, onChange, style }) => {
  const [currentValue, setCurrentValue] = useState(value);

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  const handleBlur = () => {
    if (currentValue !== value) {
      onChange(currentValue);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleBlur();
    } else if (e.key === "Escape") {
      setCurrentValue(value);
    }
  };

  return (
    <div className="editable-field">
      <h6 className="editable-field__label">{label}</h6>
      <input
        value={currentValue}
        onChange={(e) => setCurrentValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyPress}
        autoFocus
        placeholder={currentValue ? "" : "Нет данных"}
        style={style}
      />
    </div>
  );
};

export default EditableField;
