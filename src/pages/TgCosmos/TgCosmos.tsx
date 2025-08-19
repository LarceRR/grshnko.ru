import React from "react";
import "./TgCosmos.scss";
import GeneratePost from "./components/GeneratePost/GeneratePost";
import ImageSelector from "./components/ImageSelector/ImageSelector";
import SendMessage from "./components/SendMessage/SendMessage";
import AiAnswer from "./components/GeneratePost/AiAnswer/AiAnswer";
import { AppVersion } from "./components/AppVersion/AppVersion";

interface ITgCosmosProps {}

const TgCosmos: React.FC<ITgCosmosProps> = () => {
  return (
    <div className="tg-cosmos-wrapper">
      {/* <DashboardHeader /> */}
      <GeneratePost />
      <AiAnswer />
      <ImageSelector />
      <SendMessage />
      <AppVersion />
    </div>
  );
};

export default TgCosmos;
