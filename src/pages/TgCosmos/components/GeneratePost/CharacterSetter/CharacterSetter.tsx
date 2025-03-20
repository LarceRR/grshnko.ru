import TextArea from "antd/es/input/TextArea";
import React from "react";
import { useAppDispatch, useAppSelector } from "../../../../../store/hooks";
import { setCharacter } from "../../../../../features/characterSlice";

interface ICharacterSetterProps {}

const CharacterSetter: React.FC<ICharacterSetterProps> = () => {
  const { character } = useAppSelector((state) => state.character);
  const dispatch = useAppDispatch();

  const handleCharacterChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    dispatch(setCharacter(e.target.value));
  };

  return (
    <div className="generate-post-buttons">
      <p>Задать характер</p>
      <TextArea
        showCount
        className="generate-post-input"
        maxLength={500}
        style={{ height: "150px", resize: "none" }}
        value={character}
        onChange={handleCharacterChange}
      />
    </div>
  );
};

export default CharacterSetter;
