import { Space } from "antd";
import { Pen, Repeat2, Trash } from "lucide-react";
import { ScheduledPost } from "../../types/sheduledPost";

interface PostActionsProps {
  post: ScheduledPost;
  userId?: string;
  onEdit: (post: ScheduledPost) => void;
  onDelete: (postId: string) => Promise<void>;
  onRepeat: (post: ScheduledPost) => Promise<void>;
}

const PostActions = ({
  post,
  onEdit,
  onDelete,
  onRepeat,
}: PostActionsProps) => {
  return (
    <div className="actions">
      <Space>
        <Repeat2
          onClick={() => onRepeat(post)}
          size={20}
          color="var(--text-color)"
          style={{ cursor: "pointer" }}
        />
        <Pen
          onClick={() => onEdit(post)}
          size={20}
          color="var(--text-color)"
          style={{ cursor: "pointer" }}
        />
        {post.status == "PENDING" && (
          <Trash
            onClick={() => onDelete(post.id)}
            size={20}
            color="var(--text-color)"
            style={{ cursor: "pointer" }}
          />
        )}
      </Space>
    </div>
  );
};

export default PostActions;
