import React, { useState } from "react";
import { Image, Modal } from "antd";
import "./TableMedia.scss";
import { VideoOff, ImageOff } from "lucide-react";
import { IScheduledVideo } from "../../../types/sheduledPost";

interface TableMediaProps {
  photos?: string[];
  videos?: IScheduledVideo[];
}

type MediaItem =
  | { type: "photo"; src: string }
  | { type: "video"; video: IScheduledVideo };

const TableMedia: React.FC<TableMediaProps> = ({
  photos = [],
  videos = [],
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [brokenPhotos, setBrokenPhotos] = useState<string[]>([]);

  const handleOpenModal = () => {
    if (photos.length || videos.length) setIsModalVisible(true);
  };

  const handlePhotoError = (src: string) => {
    setBrokenPhotos((prev) => [...new Set([...prev, src])]);
  };

  // Объединяем все медиа
  const allMedia: MediaItem[] = [
    ...photos.map((p) => ({ type: "photo" as const, src: p })),
    ...videos.map((v) => ({ type: "video" as const, video: v })),
  ];

  const maxPreview = 3;
  const previewMedia = allMedia.slice(0, maxPreview);
  const remainingCount = allMedia.length - maxPreview;

  return (
    <>
      <div className="table-media-preview" onClick={handleOpenModal}>
        {previewMedia.map((media, index) => {
          if (media.type === "video") {
            return (
              <span
                key={`video-${media.video.id}`}
                className="video-error"
                title="Видео недоступно"
              >
                <VideoOff size={20} color="black" />
              </span>
            );
          } else {
            return brokenPhotos.includes(media.src) ? (
              <span
                key={`photo-error-${index}`}
                className="photo-error"
                title="Вероятно, ссылка на фото устарела"
              >
                <ImageOff size={20} color="black" />
              </span>
            ) : (
              <img
                key={`photo-${index}`}
                src={media.src}
                alt={`media-${index}`}
                onError={() => handlePhotoError(media.src)}
              />
            );
          }
        })}

        {remainingCount > 0 && (
          <div className="table-media-count">+{remainingCount}</div>
        )}
      </div>

      <Modal
        open={isModalVisible}
        title="Медиа"
        footer={null}
        centered
        onCancel={() => setIsModalVisible(false)}
        width={800}
      >
        <div className="table-media-modal">
          {photos.map((photo, index) =>
            brokenPhotos.includes(photo) ? (
              <span
                key={`modal-photo-error-${index}`}
                className="photo-error"
                title="Вероятно, ссылка на фото устарела"
              >
                <ImageOff size={20} color="var(--text-color)" />
                <p>Ссылка на фото устарела</p>
              </span>
            ) : (
              <Image
                width={200}
                key={`modal-photo-${index}`}
                src={photo}
                alt={`photo-${index}`}
                onError={() => handlePhotoError(photo)}
              />
            )
          )}
          {videos.map((video) => (
            <span
              key={`modal-video-error-${video.id}`}
              className="video-error"
              title="Видео недоступно"
            >
              <VideoOff size={20} color="var(--text-color)" />
              <p>Видео недоступно</p>
            </span>
          ))}
        </div>
      </Modal>
    </>
  );
};

export default TableMedia;
