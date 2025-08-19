import React, { CSSProperties } from "react";
import "./CircleImage.scss";

interface ICircleImageProps {
  src?: string;
  alt?: string;
  size?: number;
  text?: string;
  bgColor?: string;
  textColor?: string;
  onClick?: () => void; // callback при клике
  imageStyle?: CSSProperties;
  textStyle?: CSSProperties;
}

const CircleImage: React.FC<ICircleImageProps> = ({
  src,
  alt = "avatar",
  text,
  onClick,
  imageStyle,
  textStyle,
}) => {
  return (
    <div className="circle-image" onClick={onClick}>
      {src && <img src={src} alt={alt} style={imageStyle} />}
      {text && <span style={textStyle}>{text}</span>}
    </div>
  );
};

export default CircleImage;
