import axios from "axios";
import { useState } from "react";

type Term = {
  id: number;
  term: string;
} | null;

const RandomTerm = () => {
  const [randomTerm, setRandomTerm] = useState<Term>(null);

  const getRandomTerm = async () => {
    const response = await axios.get(
      "http://162.248.224.199:3000/api/getRandomTerm"
    );
    setRandomTerm(response.data);
  };

  return (
    <div>
      <button onClick={getRandomTerm}>Get Random Term</button>
      <p>{randomTerm?.term}</p>
    </div>
  );
};

export default RandomTerm;
