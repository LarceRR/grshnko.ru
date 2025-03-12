import "./ImageSelector.scss";
import { Button } from "antd";
import { Ban, Ellipsis } from "lucide-react";
import { useAppSelector } from "../../../../store/hooks";
import useGetImages from "../../../../hooks/useGetImages";
import { IImage, setSelectImage } from "../../../../features/images";
import { useDispatch } from "react-redux";

export interface ImageData {
  alt: string;
  avg_color: string;
  height: number;
  id: number;
  liked: boolean;
  photographer: string;
  photographer_id: number;
  photographer_url: string;
  src: {
    landscape: string;
    large: string;
    large2x: string;
    medium: string;
    original: string;
    portrait: string;
    small: string;
    tiny: string;
  };
  url: string;
  width: number;
}

const ImageSelector = () => {
  const topic = useAppSelector((state) => state.topic.topic.eng_term);
  const { images, error, loading } = useAppSelector((state) => state.images);
  const dispatch = useDispatch();

  const { fetchImages } = useGetImages();

  const handleSelectImage = (url: string) => {
    dispatch(setSelectImage(url));
  };

  return (
    <div className="image-selector-wrapper">
      <div className="image-selector-result">
        <div className="image-selector-result__header">
          <div className="image-selector-result__header-buttons">
            <Button
              className="get-new-images"
              style={{ backgroundColor: error ? "red" : "" }}
              onClick={fetchImages}
              loading={loading}
              icon={error ? <Ban width={20} /> : ""}
            >
              Получить изображения
            </Button>
            <Ellipsis />
          </div>
        </div>
        <div className="image-selector-gallery">
          {images &&
            topic &&
            images.map((image: IImage, index: number) => (
              <div
                key={index}
                className="image-selector-gallery-image"
                onClick={() => handleSelectImage(image.url)}
              >
                <img
                  className="blured_image"
                  src={image.url}
                  alt="no image"
                ></img>
                <div className="white-cover-image"></div>
                <img className="image" src={image.url} alt="no image"></img>
              </div>
            ))}

          {!topic && (
            <p
              style={{
                padding: "20px",
                opacity: 0.5,
                fontSize: "20px",
                textAlign: "center",
                lineHeight: "25px",
              }}
            >
              Выберите тему чтобы изображения загрузились
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageSelector;
