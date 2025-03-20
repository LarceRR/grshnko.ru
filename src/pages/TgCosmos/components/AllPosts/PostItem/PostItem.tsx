import React, { useEffect, useState } from "react";
import { Message } from "../../../../../types/postTypes";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import usePostController from "../../../../../hooks/postsController";
import "./PostItem.scss";
import EmojiWrapper from "../../DashboardHeader/PopularPost/EmojiWrapper/EmojiWrapper";
import { Eye, Loader } from "lucide-react"; // Предположим, что у вас есть компонент Loader
import { useInView } from "react-intersection-observer";
import { Image } from "antd";

interface IPostItemProps {
  post: Message;
}

dayjs.extend(relativeTime);
dayjs.locale("ru");

const PostItem: React.FC<IPostItemProps> = ({ post }) => {
  const { getPostPhotos, postPhotos } = usePostController();
  const { ref, inView } = useInView({ triggerOnce: true });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (inView) {
      getPostPhotos(post).then(() => setIsLoading(false));
    }
  }, [inView]);

  return (
    <div ref={ref} className="post-item-wrapper">
      <div className={`post-item-image ${isLoading ? "loading" : ""}`}>
        {isLoading ? (
          <div className="loader-wrapper">
            <Loader className="loader" />
          </div>
        ) : (
          postPhotos && (
            <Image
              src={postPhotos}
              alt=""
              onLoad={() => setIsLoading(false)}
              placeholder={<Loader />}
            />
          )
        )}
      </div>
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
