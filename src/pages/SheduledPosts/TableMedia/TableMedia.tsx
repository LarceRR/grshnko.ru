import React, { useState } from "react";
import { Image, Modal } from "antd";
import "./TableMedia.scss";

interface TableMediaProps {
  photos?: string[];
  videos?: string[];
}

const TableMedia: React.FC<TableMediaProps> = ({
  photos = [],
  videos = [],
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleOpenModal = () => {
    if (photos.length || videos.length) setIsModalVisible(true);
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
          return isVideo ? (
            <video key={`video-${index}`} src={media} muted />
          ) : (
            <img key={`photo-${index}`} src={media} alt={`media-${index}`} />
          );
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
          {photos.map((photo, index) => (
            <Image
              width={200}
              key={`modal-photo-${index}`}
              src={photo}
              alt={`photo-${index}`}
            />
          ))}
          {videos.map((video, index) => (
            <video key={`modal-video-${index}`} src={video} controls />
          ))}
        </div>
      </Modal>
    </>
  );
};

export default TableMedia;
