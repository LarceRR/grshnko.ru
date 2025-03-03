import React from "react";
import "./TgCosmos.scss";
import GeneratePost from "./components/GeneratePost/GeneratePost";
import DashboardHeader from "./components/DashboardHeader/DashboardHeader";

interface ITgCosmosProps {}

const TgCosmos: React.FC<ITgCosmosProps> = () => {
  return (
    <div className="tg-cosmos-wrapper">
      <DashboardHeader />
      <GeneratePost />
    </div>
  );
};

export default TgCosmos;
