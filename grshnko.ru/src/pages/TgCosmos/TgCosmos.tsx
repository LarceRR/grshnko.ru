import React from "react";
import { DSGenerator } from "../../components/DSGenerator";
import RandomTerm from "../../components/randomTerm";

interface ITgCosmosProps {}

const TgCosmos: React.FC<ITgCosmosProps> = (props) => {
  return (
    <div>
      <DSGenerator />
      <RandomTerm />
    </div>
  );
};

export default TgCosmos;
