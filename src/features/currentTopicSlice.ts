// src/features/counterSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ITopic {
  id: number;
  term: string;
  eng_term: string;
}

interface ITopicState {
  topic: {
    id: number;
    term: string;
    eng_term: string;
  },
}

const initialState: ITopicState = {
  topic: {
    id: 0,
    term: "",
    eng_term: "",
  },
}

export const topicSlice = createSlice({
  name: "post_topic",
  initialState,
  reducers: {
    setTopic: (state, action: PayloadAction<ITopic>) => {
      state.topic = action.payload;
    }
  },
});

export const { setTopic } = topicSlice.actions;

export default topicSlice.reducer;
