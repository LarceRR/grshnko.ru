import React, { useState } from "react";
import { IImage } from "../../../../../features/imagesSlice";
import { Image } from "antd";
import SelectableBadge from "../../SelectableBadge/SelectableBadge";

interface IImageComponentProps {
  handleSelectImage: (image: IImage) => void;
  image: IImage;
  selectedImages: IImage[];
}

const ImageComponent: React.FC<IImageComponentProps> = ({
  handleSelectImage,
  image,
  selectedImages,
}) => {
  const [error, setError] = useState(false);

  const isSelected = selectedImages.includes(image);
  const selectedIndex = selectedImages.indexOf(image);

  if (error) return null; // если не загрузилась — не рендерим

  return (
    <div
      className="image-selector-gallery-image"
      style={{
        outline: isSelected ? "3px solid #2f77c8" : "",
      }}
    >
      <img
        onClick={(e) => e.stopPropagation()}
        className="blured_image"
        src={image.url}
        alt="blurred preview"
        onError={() => setError(true)}
      />
      <div className="white-cover-image"></div>
      <Image
        className="image"
        src={image.url}
        alt="main"
        onError={() => setError(true)}
        preview={false}
      />
      <SelectableBadge
        selected={isSelected}
        index={selectedIndex}
        onClick={() => handleSelectImage(image)}
      />
    </div>
  );
};

export default ImageComponent;
