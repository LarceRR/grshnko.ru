// src/features/counterSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ICharacterState {
  character: string
}

const initialState: ICharacterState = {
  character: ''
}

export const characterSlice = createSlice({
  name: "ai_character",
  initialState,
  reducers: {
    setCharacter: (state, action: PayloadAction<string>) => {
      state.character = action.payload;
    }
  },
});

export const { setCharacter } = characterSlice.actions;

export default characterSlice.reducer;
