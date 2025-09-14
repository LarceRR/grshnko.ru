import { Modal, Input, Space, Button } from "antd";
import { ScheduledPost } from "../../types/sheduledPost";
import { toDatetimeLocalValue } from "../../utils/date";
import { useState } from "react";

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
  const [newPhoto, setNewPhoto] = useState("");
  const [newVideo, setNewVideo] = useState("");

  if (!post) return null;

  const handleAddPhoto = () => {
    if (!newPhoto) return;
    onChange({ ...post, photos: [...post.photos, newPhoto] });
    setNewPhoto("");
  };

  const handleAddVideo = () => {
    if (!newVideo) return;
    onChange({ ...post, videos: [...post.videos, newVideo] });
    setNewVideo("");
  };

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

  return (
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
          style={{ marginBottom: "1rem" }}
        />
        <Input
          placeholder="Канал"
          value={post.chatId}
          onChange={(e) => onChange({ ...post, chatId: e.target.value })}
          style={{ marginBottom: "1rem" }}
        />
        <Input
          placeholder="Дата публикации"
          type="datetime-local"
          value={toDatetimeLocalValue(post.timestamp)}
          onChange={(e) => {
            const localDate = new Date(e.target.value);
            onChange({ ...post, timestamp: localDate.toISOString() });
          }}
          style={{ marginBottom: "1rem" }}
        />

        {/* Фото */}
        <div style={{ marginBottom: "1rem" }}>
          <Space>
            {post.photos.map((p, i) => (
              <div key={i} style={{ position: "relative" }}>
                <img
                  src={p}
                  alt={`photo-${i}`}
                  width={30}
                  height={30}
                  style={{ objectFit: "cover" }}
                />
                <Button
                  type="link"
                  size="small"
                  danger
                  style={{
                    position: "absolute",
                    top: -5,
                    right: -5,
                    padding: 0,
                  }}
                  onClick={() => handleRemovePhoto(i)}
                >
                  ×
                </Button>
              </div>
            ))}
          </Space>
          <Space>
            <Input
              placeholder="Новый URL фото"
              value={newPhoto}
              onChange={(e) => setNewPhoto(e.target.value)}
            />
            <Button type="primary" size="small" onClick={handleAddPhoto}>
              Добавить
            </Button>
          </Space>
        </div>

        {/* Видео */}
        <div>
          <Space>
            {post.videos.map((v, i) => (
              <div key={i} style={{ position: "relative" }}>
                <video
                  src={v}
                  width={30}
                  height={30}
                  style={{ objectFit: "cover" }}
                />
                <Button
                  type="link"
                  size="small"
                  danger
                  style={{
                    position: "absolute",
                    top: -5,
                    right: -5,
                    padding: 0,
                  }}
                  onClick={() => handleRemoveVideo(i)}
                >
                  ×
                </Button>
              </div>
            ))}
          </Space>
          <Space style={{ marginTop: "0.5rem" }}>
            <Input
              placeholder="Новый URL видео"
              value={newVideo}
              onChange={(e) => setNewVideo(e.target.value)}
            />
            <Button type="primary" size="small" onClick={handleAddVideo}>
              Добавить
            </Button>
          </Space>
        </div>
      </div>
    </Modal>
  );
};

export default EditPostModal;
