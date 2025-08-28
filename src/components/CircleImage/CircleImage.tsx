import React, { CSSProperties, ReactNode } from "react";
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
  className?: string;
  children?: ReactNode;
}

const CircleImage: React.FC<ICircleImageProps> = ({
  src,
  alt = "avatar",
  text,
  onClick,
  imageStyle,
  textStyle,
  className,
  children,
}) => {
  return (
    <div className={`circle-image ` + className} onClick={onClick}>
      {src && <img src={src} alt={alt} style={imageStyle} />}
      {text && <span style={textStyle}>{text}</span>}
      {children}
    </div>
  );
};

export default CircleImage;
