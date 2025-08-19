import React, { useEffect, useState } from "react";
import { Message } from "../../../../../types/postTypes";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import usePostController from "../../../../../hooks/postsController";
import "./PostItem.scss";
import EmojiWrapper from "../../DashboardHeader/PopularPost/EmojiWrapper/EmojiWrapper";
import { Eye, Loader } from "lucide-react";
import { useInView } from "react-intersection-observer";
import { Image, Modal } from "antd";

interface IPostItemProps {
  post: Message;
  onClick?: (event: React.MouseEvent<HTMLDivElement>, post: Message) => void;
  isCopy?: boolean;
}

dayjs.extend(relativeTime);
dayjs.locale("ru");

const PostItem: React.FC<IPostItemProps> = ({ post, onClick, isCopy }) => {
  const { getPostPhotos, postPhotos } = usePostController();
  const { ref, inView } = useInView({ triggerOnce: true });
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (inView) {
      getPostPhotos(post).then(() => setIsLoading(false));
    }
  }, [inView]);

  const handlePostClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isCopy) {
      event.stopPropagation();
      setIsModalOpen(true);

      // Если есть внешний обработчик, вызываем его
      if (onClick) {
        onClick(event, post);
      }
    }
  };

  const handleCloseModal = (event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    setIsModalOpen(false);
  };

  return (
    <>
      <div
        ref={ref}
        className="post-item-wrapper"
        style={{ cursor: "pointer" }}
      >
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
                wrapperStyle={{
                  height: "100%",
                }}
              />
            )
          )}
        </div>
        <p className="post-item-message" onClick={handlePostClick}>
          {post.message}
        </p>
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

      <Modal
        className="modal"
        title="Детали поста"
        open={isModalOpen}
        onCancel={handleCloseModal}
        footer={null}
        centered
      >
        <PostItem post={post} isCopy={true} />
      </Modal>
    </>
  );
};

export default PostItem;
