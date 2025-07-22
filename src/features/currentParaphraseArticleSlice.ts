// src/features/counterSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface IPraphraseState {
  paraphrase: string
}

const initialState: IPraphraseState = {
  paraphrase: ''
}

export const topicSlice = createSlice({
  name: "post_paraphraseArticle",
  initialState,
  reducers: {
    setParaphrase: (state, action: PayloadAction<string>) => {
      state.paraphrase = action.payload
    }
  },
});

export const { setParaphrase } = topicSlice.actions;

export default topicSlice.reducer;
