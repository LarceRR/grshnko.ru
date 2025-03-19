import React from "react";
import { IImage } from "../../../../../features/images";

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
      onClick={() => handleSelectImage(image)}
      style={{
        outline: selectedImages.includes(image) ? "2px solid #2f77c8" : "",
      }}
    >
      <img
        className="blured_image"
        src={image.thumbnail.url}
        alt="no image"
      ></img>
      <div className="white-cover-image"></div>
      <img className="image" src={image.thumbnail.url} alt="no image"></img>
      {selectedImages.includes(image) && (
        <div className="selected-image">
          {selectedImages.indexOf(image) + 1}
        </div>
      )}
    </div>
  );
};

export default ImageComponent;
