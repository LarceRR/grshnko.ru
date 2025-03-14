import React, { useEffect } from "react";
import { Message } from "../../../../../types/postTypes";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import usePostController from "../../../../../hooks/postsController";
import "./PostItem.scss";
import EmojiWrapper from "../../DashboardHeader/PopularPost/EmojiWrapper/EmojiWrapper";
import { Eye } from "lucide-react";

interface IPostItemProps {
  post: Message;
}

dayjs.extend(relativeTime);
dayjs.locale("ru");

const PostItem: React.FC<IPostItemProps> = ({ post }) => {
  const { getPostPhotos, postPhotos } = usePostController();

  useEffect(() => {
    getPostPhotos(post);
  }, []);

  return (
    <div className="post-item-wrapper">
      {postPhotos && (
        <div className="post-item-image">
          <img src={postPhotos} alt="" />
        </div>
      )}
      <p className="post-item-message">{post.message}</p>
      {post.reactions?.results && post.reactions?.results.length > 0 && (
        <EmojiWrapper post={post} />
      )}
      <div className="post-item-date">
        <div>
          <Eye width={16} />
          <span>{post.views}</span>
        </div>
        <div>
          <span>
            {dayjs(post.date * 1000)
              .startOf("millisecond")
              .fromNow()}
          </span>
          <span>({dayjs(post.date * 1000).format("HH:mm")})</span>
        </div>
      </div>
    </div>
  );
};

export default PostItem;
