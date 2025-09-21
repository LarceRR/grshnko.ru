import React, { useState } from "react";
import { Image, Modal } from "antd";
import "./TableMedia.scss";
import { VideoOff, ImageOff } from "lucide-react";

interface TableMediaProps {
  photos?: string[];
  videos?: string[];
}

const TableMedia: React.FC<TableMediaProps> = ({
  photos = [],
  videos = [],
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [brokenVideos, setBrokenVideos] = useState<string[]>([]);
  const [brokenPhotos, setBrokenPhotos] = useState<string[]>([]);

  const handleOpenModal = () => {
    if (photos.length || videos.length) setIsModalVisible(true);
  };

  const handleVideoError = (src: string) => {
    setBrokenVideos((prev) => [...new Set([...prev, src])]);
  };

  const handlePhotoError = (src: string) => {
    setBrokenPhotos((prev) => [...new Set([...prev, src])]);
  };

  // Объединяем медиа для превью
  const allMedia = [...photos, ...videos];
  const maxPreview = 3;
  const previewMedia = allMedia.slice(0, maxPreview);
  const remainingCount = allMedia.length - maxPreview;

  return (
    <>
      <div className="table-media-preview" onClick={handleOpenModal}>
        {previewMedia.map((media, index) => {
          const isVideo = videos.includes(media);
          if (isVideo) {
            return brokenVideos.includes(media) ? (
              <span
                key={`video-error-${index}`}
                className="video-error"
                title="Вероятно, ссылка на видео устарела"
              >
                <VideoOff size={20} color="black" />
              </span>
            ) : (
              <video
                key={`video-${index}`}
                src={media}
                muted
                onError={() => handleVideoError(media)}
              />
            );
          } else {
            return brokenPhotos.includes(media) ? (
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
                src={media}
                alt={`media-${index}`}
                onError={() => handlePhotoError(media)}
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
          {videos.map((video, index) =>
            brokenVideos.includes(video) ? (
              <span
                key={`modal-video-error-${index}`}
                className="video-error"
                title="Вероятно, ссылка на видео устарела"
              >
                <VideoOff size={20} color="var(--text-color)" />
                <p>Ссылка на видео устарела</p>
              </span>
            ) : (
              <video
                key={`modal-video-${index}`}
                src={video}
                controls
                onError={() => handleVideoError(video)}
              />
            )
          )}
        </div>
      </Modal>
    </>
  );
};

export default TableMedia;
