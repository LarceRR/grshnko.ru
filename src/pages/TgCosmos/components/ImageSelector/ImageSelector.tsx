import { useEffect, useState } from "react";
import "./ImageSelector.scss";
import { Button } from "antd";
import { Ban, Ellipsis } from "lucide-react";
import axios, { AxiosResponse } from "axios";
import { useAppSelector } from "../../../../store/hooks";

export interface IImageResponse {
  images: string[];
}

const ImageSelector = () => {
  const [images, setImages] = useState<string[]>([]);
  const [imagesError, setImagesError] = useState<boolean>(false);
  const [newImageTriggerer, setNewImageTriggerer] = useState<boolean>(false);
  const [imageLoading, setImageLoading] = useState<boolean>(false);

  const topic = useAppSelector((state) => state.topic.topic);

  const getNewImagesTrigger = () => {
    setNewImageTriggerer(!newImageTriggerer);
  };

  useEffect(() => {
    setImageLoading(true);
    const fetchImages = async () => {
      try {
        const response: AxiosResponse<IImageResponse> = await axios.get(
          `${
            import.meta.env.VITE_API_URL
          }/getGoogleImages?query=${topic} в науке`
        );

        if (response) {
          setImages(response.data.images);
          setImagesError(false);
          setImageLoading(false);
        }
      } catch (error) {
        setImageLoading(false);
        setImagesError(true);
        console.log(error);
      }
    };

    fetchImages();
  }, [topic, newImageTriggerer]);

  return (
    <div className="image-selector-wrapper">
      <div className="image-selector-result">
        <div className="image-selector-result__header">
          <p>Выберите от 1 до 3 из предложенных изображенний</p>
          <div className="image-selector-result__header-buttons">
            <Button
              className="get-new-images"
              style={{ backgroundColor: imagesError ? "red" : "" }}
              onClick={getNewImagesTrigger}
              loading={imageLoading}
              icon={imagesError ? <Ban width={20} /> : ""}
            >
              Получить изображежния
            </Button>
            <Ellipsis />
          </div>
        </div>
        <div className="image-selector-gallery">
          {images &&
            images.map((image: string, index: number) => (
              <div key={index} className="image-selector-gallery-image">
                <img className="blured_image" src={image} alt="no image"></img>
                <div className="white-cover-image"></div>
                <img className="image" src={image} alt="no image"></img>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default ImageSelector;
