import React from "react";
import "./TgCosmos.scss";
import GeneratePost from "./components/GeneratePost/GeneratePost";
import DashboardHeader from "./components/DashboardHeader/DashboardHeader";
import ImageSelector from "./components/ImageSelector/ImageSelector";

interface ITgCosmosProps {}

const TgCosmos: React.FC<ITgCosmosProps> = () => {
  return (
    <div className="tg-cosmos-wrapper">
      <DashboardHeader />
      <GeneratePost />
      <ImageSelector />
    </div>
  );
};

export default TgCosmos;
