import { Input } from "antd";
import { Eye } from "lucide-react";
import "./PopularPost.scss";
import { Message } from "../../../../../types/postTypes";
import { getEmojiUrl } from "../../../../../functions/getEmojiUrl";

interface IPopularPostProps {
  maxShowEmojies: number;
  popularPosts: Message[] | null;
}

const PopularPost: React.FC<IPopularPostProps> = ({
  maxShowEmojies,
  popularPosts,
}) => {
  return (
    <div className="popular-post-item">
      <div className="popular-post-item__header">
        <span>Популярный пост</span>
        <div>
          <div
            style={{
              zIndex:
                (popularPosts?.[0]?.reactions?.results?.length ?? 0) >
                maxShowEmojies
                  ? 0
                  : 1,
              position:
                (popularPosts?.[0]?.reactions?.results?.length ?? 0) >
                maxShowEmojies
                  ? "unset"
                  : "relative",
            }}
          >
            {popularPosts &&
              popularPosts[0].reactions?.results.map((item) => {
                return (
                  <div>
                    <img
                      width="20px"
                      src={getEmojiUrl(item.reaction.emoticon) ?? ""}
                      alt={item.reaction.emoticon}
                    />
                    <span>{item.count}</span>
                  </div>
                );
              })}
          </div>
        </div>
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
  );
};

export default PopularPost;
