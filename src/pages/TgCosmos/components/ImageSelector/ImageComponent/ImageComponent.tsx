import React from "react";
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
  const isSelected = selectedImages.includes(image);
  const selectedIndex = selectedImages.indexOf(image);

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
        alt="no image"
      />
      <div className="white-cover-image"></div>
      <Image className="image" src={image.url} alt="no image" />
      <SelectableBadge
        selected={isSelected}
        index={selectedIndex}
        onClick={() => handleSelectImage(image)}
      />
    </div>
  );
};

export default ImageComponent;
