import { Modal, Input, Button, Image } from "antd";
import { ScheduledPost } from "../../../types/sheduledPost";
import { toDatetimeLocalValue } from "../../../utils/date";
import { useState } from "react";
import "./EditPostModal.scss";
import { Plus, X } from "lucide-react";

interface EditPostModalProps {
  post: ScheduledPost | null;
  onCancel: () => void;
  onSave: () => Promise<void>;
  onChange: (post: ScheduledPost) => void;
}

const EditPostModal = ({
  post,
  onCancel,
  onSave,
  onChange,
}: EditPostModalProps) => {
  const [addMediaModal, setAddMediaModal] = useState<{
    type: "photo" | "video";
    open: boolean;
  }>({ type: "photo", open: false });
  const [tempUrl, setTempUrl] = useState("");

  if (!post) return null;

  const handleRemovePhoto = (index: number) => {
    const updated = [...post.photos];
    updated.splice(index, 1);
    onChange({ ...post, photos: updated });
  };

  const handleRemoveVideo = (index: number) => {
    const updated = [...post.videos];
    updated.splice(index, 1);
    onChange({ ...post, videos: updated });
  };

  const handleAddMedia = () => {
    if (!tempUrl) return;
    if (addMediaModal.type === "photo") {
      onChange({ ...post, photos: [...post.photos, tempUrl] });
    } else {
      onChange({ ...post, videos: [...post.videos, tempUrl] });
    }
    setTempUrl("");
    setAddMediaModal({ ...addMediaModal, open: false });
  };

  return (
    <>
      <Modal
        title="Редактировать отложенный пост"
        open={!!post}
        onCancel={onCancel}
        onOk={onSave}
        okText="Сохранить"
        cancelText="Отмена"
      >
        <div className="modal-content">
          <Input
            placeholder="Текст"
            value={post.text}
            onChange={(e) => onChange({ ...post, text: e.target.value })}
          />
          <Input
            placeholder="Канал"
            value={post.chatId}
            onChange={(e) => onChange({ ...post, chatId: e.target.value })}
          />
          <Input
            placeholder="Дата публикации"
            type="datetime-local"
            value={toDatetimeLocalValue(post.timestamp)}
            onChange={(e) => {
              const localDate = new Date(e.target.value);
              onChange({ ...post, timestamp: localDate.toISOString() });
            }}
          />

          {/* Фото */}
          <div className="media-section">
            <div className="media-list">
              {post.photos.map((p, i) => (
                <div key={i} className="media-item">
                  <Image src={p} alt={`photo-${i}`} />
                  <Button
                    type="link"
                    size="small"
                    danger
                    className="remove-btn"
                    onClick={() => handleRemovePhoto(i)}
                  >
                    <X size={16} color="var(--text-color)" />
                  </Button>
                </div>
              ))}
              <Button
                type="primary"
                size="small"
                onClick={() => setAddMediaModal({ type: "photo", open: true })}
              >
                <Plus size={16} />
              </Button>
            </div>
          </div>

          {/* Видео */}
          <div className="media-section">
            <div className="media-list">
              {post.videos.map((v, i) => (
                <div key={i} className="media-item">
                  <video src={v} />
                  <Button
                    type="link"
                    size="small"
                    danger
                    className="remove-btn"
                    onClick={() => handleRemoveVideo(i)}
                  >
                    <X size={16} color="var(--text-color)" />
                  </Button>
                </div>
              ))}
              <Button
                type="primary"
                size="small"
                onClick={() => setAddMediaModal({ type: "video", open: true })}
              >
                <Plus size={16} />
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Модальное окно добавления медиа */}
      <Modal
        title={
          addMediaModal.type === "photo" ? "Добавить фото" : "Добавить видео"
        }
        open={addMediaModal.open}
        onCancel={() => setAddMediaModal({ ...addMediaModal, open: false })}
        onOk={handleAddMedia}
        okText="Добавить"
      >
        <Input
          placeholder="URL"
          value={tempUrl}
          onChange={(e) => setTempUrl(e.target.value)}
        />
      </Modal>
    </>
  );
};

export default EditPostModal;
