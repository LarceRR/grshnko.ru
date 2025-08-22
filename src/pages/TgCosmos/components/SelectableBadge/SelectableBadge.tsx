// SelectableBadge.tsx
import React from "react";
import "./SelectableBadge.scss";
import { Check } from "lucide-react";

interface ISelectableBadgeProps {
  selected: boolean;
  index?: number;
  onClick: () => void;
  className?: string;
}

const SelectableBadge: React.FC<ISelectableBadgeProps> = ({
  selected,
  index,
  onClick,
  className = "",
}) => {
  return (
    <div
      className={`selected-image ${className}`}
      onClick={onClick}
      style={{
        backgroundColor: selected ? "#2f77c8" : "",
      }}
    >
      {selected && index !== undefined ? index + 1 : null}
      {selected && index === undefined ? (
        <Check size={20} color="white" />
      ) : null}
    </div>
  );
};

export default SelectableBadge;
