import React from "react";
import "./TgCosmos.scss";
import GeneratePost from "./components/GeneratePost/GeneratePost";
import DashboardHeader from "./components/DashboardHeader/DashboardHeader";
import ImageSelector from "./components/ImageSelector/ImageSelector";
import SendMessage from "./components/SendMessage/SendMessage";

interface ITgCosmosProps {}

const TgCosmos: React.FC<ITgCosmosProps> = () => {
  return (
    <div className="tg-cosmos-wrapper">
      <DashboardHeader />
      <GeneratePost />
      <ImageSelector />
      <SendMessage />
    </div>
  );
};

export default TgCosmos;
