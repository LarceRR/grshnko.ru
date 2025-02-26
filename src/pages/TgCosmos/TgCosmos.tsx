import React from "react";
import { DSGenerator } from "../../components/DSGenerator";
import RandomTerm from "../../components/randomTerm";

interface ITgCosmosProps {}

const TgCosmos: React.FC<ITgCosmosProps> = () => {
  return (
    <div>
      <DSGenerator />
      <RandomTerm />
    </div>
  );
};

export default TgCosmos;
