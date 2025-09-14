import React from "react";
import "./TgCosmos.scss";
import GeneratePost from "./components/GeneratePost/GeneratePost";
import ImageSelector from "./components/ImageSelector/ImageSelector";
import SendMessage from "./components/SendMessage/SendMessage";
import AiAnswer from "./components/GeneratePost/AiAnswer/AiAnswer";
import { AppVersion } from "./components/AppVersion/AppVersion";

interface ITgCosmosProps {}

const TgCosmos: React.FC<ITgCosmosProps> = () => {
  const blocks = [
    <GeneratePost key="generate" />,
    <AiAnswer key="ai" />,
    <ImageSelector key="images" />,
    <SendMessage key="send" />,
    <AppVersion key="version" />,
  ];

  return (
    <div className="tg-cosmos-wrapper">
      {blocks.map((block, index) => (
        <div
          key={index}
          className="tg-cosmos-block"
          style={{
            opacity: 0,
            animation: `fadeIn 0.4s ease forwards`,
            animationDelay: `${index * 40}ms`,
          }}
        >
          {block}
        </div>
      ))}
    </div>
  );
};

export default TgCosmos;
