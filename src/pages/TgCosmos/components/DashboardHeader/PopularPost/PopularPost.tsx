import { Input, Modal, Skeleton } from "antd";
import { Eye } from "lucide-react";
import "./PopularPost.scss";
import { Message } from "../../../../../types/postTypes";
import usePostController from "../../../../../hooks/postsController";
import { useEffect, useState } from "react";
import EmojiWrapper from "./EmojiWrapper/EmojiWrapper";
import PostItem from "../../AllPosts/PostItem/PostItem";

interface IPopularPostProps {
  maxShowEmojies: number;
  popularPosts: Message[] | null;
}

const PopularPost: React.FC<IPopularPostProps> = ({ popularPosts }) => {
  const { getPostPhotos, postPhotos } = usePostController();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (popularPosts) getPostPhotos(popularPosts[0]);
  }, [popularPosts]);

  // useEffect(() => {
  //   if (postPhotos) console.log(postPhotos);
  // }, [postPhotos]);

  const handleOpenModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  const handleCloseModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  const handleModalContentClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Останавливаем всплытие события
  };

  if (!popularPosts || !postPhotos)
    return (
      <Skeleton.Avatar
        active={true}
        size={"large"}
        shape="square"
        style={{
          height: "70px",
          width: "100%",
          borderRadius: 5,
        }}
      />
    );

  return (
    <div className="popular-post-item" onClick={handleOpenModal}>
      {postPhotos ? (
        <div className="post-photos">
          <img src={postPhotos} alt={""} />
        </div>
      ) : (
        <Skeleton.Avatar
          active={true}
          size={"large"}
          shape="square"
          style={{
            height: "70px",
            width: "100%",
            borderRadius: 5,
          }}
        />
      )}
      <div>
        <div className="popular-post-item__header">
          <span>Популярный пост</span>
          {popularPosts && <EmojiWrapper post={popularPosts[0]} />}
        </div>
        {popularPosts && (
          <div className="post">
            <div className="input-wrapper">
              <Input
                value={popularPosts[0].message}
                className="input"
                disabled
                maxLength={50}
              />
            </div>
            <div className="views">
              <Eye width={20} />
              <span>{popularPosts[0].views}</span>
            </div>
          </div>
        )}
      </div>
      <Modal
        className="modal"
        title="Популярный пост"
        open={isModalOpen}
        onCancel={handleCloseModal}
        footer={[]}
        centered
      >
        <div onClick={handleModalContentClick}>
          <PostItem post={popularPosts[0]} />
        </div>
      </Modal>
    </div>
  );
};

export default PopularPost;
