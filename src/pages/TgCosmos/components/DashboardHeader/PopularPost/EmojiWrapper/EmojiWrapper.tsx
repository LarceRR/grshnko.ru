import React from "react";
import { Message } from "../../../../../../types/postTypes";
import { getEmojiUrl } from "../../../../../../functions/getEmojiUrl";
import "./EmojiWrapper.scss";

interface IEmojiWrapperProps {
  post: Message;
}

const EmojiWrapper: React.FC<IEmojiWrapperProps> = ({ post }) => {
  return (
    <div className="emoji-wrapper">
      <div>
        {post &&
          post.reactions?.results.map((item) => {
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
  );
};

export default EmojiWrapper;
