import { Modal, Input } from "antd";
import { ScheduledPost } from "../../types/sheduledPost";
import { toDatetimeLocalValue } from "../../utils/date";

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
  if (!post) return null;

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
        />
      </div>
    </Modal>
  );
};

export default EditPostModal;
