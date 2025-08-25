import "./ImageSelector.scss";
import { Button } from "antd";
import { Ban, Ellipsis } from "lucide-react";
import { useAppSelector } from "../../../../store/hooks";
import useGetImages from "../../../../hooks/useGetImages";
import { IImage, setSelectedImages } from "../../../../features/imagesSlice";
import { useDispatch } from "react-redux";
import ImageComponent from "./ImageComponent/ImageComponent";
import { useEffect } from "react";

const ImageSelector = () => {
  const topic = useAppSelector((state) => state.topic.topic.eng_term);
  const { images, selectedImages, error, loading } = useAppSelector(
    (state) => state.images
  );
  const dispatch = useDispatch();
  const { fetchImages } = useGetImages();

  useEffect(() => {
    console.log(images);
  }, [images]);

  const handleSelectImage = (image: IImage) => {
    if (selectedImages.includes(image)) {
      dispatch(
        setSelectedImages(selectedImages.filter((img) => img !== image))
      );
      return;
    }

    if (selectedImages.length >= 3) return;

    dispatch(setSelectedImages([...selectedImages, image]));
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
              icon={error ? <Ban width={20} /> : undefined}
            >
              Получить изображения
            </Button>
            <Ellipsis />
          </div>
        </div>
        <div className="image-selector-gallery">
          {images && topic ? (
            images.map((image: IImage, index: number) => (
              <ImageComponent
                key={index} // Используем index вместо уникального ID
                image={image}
                handleSelectImage={handleSelectImage}
                selectedImages={selectedImages}
              />
            ))
          ) : (
            <p className="no-topic-message">
              Выберите тему, чтобы изображения загрузились
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageSelector;
