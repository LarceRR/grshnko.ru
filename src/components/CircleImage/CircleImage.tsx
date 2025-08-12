import React from "react";
import "./CircleImage.scss";

interface ICircleImageProps {
  src?: string;
  alt?: string;
  size?: number;
  text?: string;
  bgColor?: string;
  textColor?: string;
  onClick?: () => void; // callback при клике
}

const CircleImage: React.FC<ICircleImageProps> = ({
  src,
  alt = "avatar",
  text,
  onClick,
}) => {
  return (
    <div className="circle-image" onClick={onClick}>
      {src && <img src={src} alt={alt} />}
      {text && <span>{text}</span>}
    </div>
  );
};

export default CircleImage;
