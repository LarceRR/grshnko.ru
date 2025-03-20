import React from "react";
import { IImage } from "../../../../../features/imagesSlice";
import { Image } from "antd";

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
  return (
    <div
      className="image-selector-gallery-image"
      style={{
        outline: selectedImages.includes(image) ? "3px solid #2f77c8" : "",
      }}
    >
      <Image
        onClick={(e) => e.stopPropagation()}
        className="blured_image"
        src={image.thumbnail.url}
        alt="no image"
      ></Image>
      <div className="white-cover-image"></div>
      <Image className="image" src={image.url} alt="no image"></Image>
      <div
        className="selected-image"
        onClick={() => handleSelectImage(image)}
        style={{
          backgroundColor: selectedImages.includes(image) ? "#2f77c8" : "",
        }}
      >
        {selectedImages.includes(image)
          ? selectedImages.indexOf(image) + 1
          : ""}
      </div>
    </div>
  );
};

export default ImageComponent;
