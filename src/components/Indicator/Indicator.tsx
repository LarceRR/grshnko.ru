import React from "react";

interface IIndicatorProps {
  color: string;
  top?: number | string;
  bottom?: number | string;
  right?: number | string;
  left?: number | string;
}

const Indicator: React.FC<IIndicatorProps> = ({
  color,
  top,
  left,
  bottom,
  right,
}) => {
  return (
    <div
      style={{
        width: 10,
        height: 10,
        background: color,
        borderRadius: 50,
        position: "absolute",
        zIndex: 1,
        left: left,
        right: right,
        bottom: bottom,
        top: top,
      }}
    ></div>
  );
};

export default Indicator;
