import { Input } from "antd";
import { Eye } from "lucide-react";
import "./PopularPost.scss";
import { Message } from "../../../../../types/postTypes";
import usePostController from "../../../../../hooks/postsController";
import { useEffect } from "react";
import EmojiWrapper from "./EmojiWrapper/EmojiWrapper";

interface IPopularPostProps {
  maxShowEmojies: number;
  popularPosts: Message[] | null;
}

const PopularPost: React.FC<IPopularPostProps> = ({ popularPosts }) => {
  const { getPostPhotos, postPhotos } = usePostController();

  useEffect(() => {
    if (popularPosts) getPostPhotos(popularPosts[0]);
  }, [popularPosts]);

  useEffect(() => {
    if (postPhotos) console.log(postPhotos);
  }, [postPhotos]);

  return (
    <div className="popular-post-item">
      {postPhotos && (
        <div className="post-photos">
          <img src={postPhotos} alt={""} />
        </div>
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
    </div>
  );
};

export default PopularPost;
