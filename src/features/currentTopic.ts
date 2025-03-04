// src/features/counterSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ITopicState {
  topic: string;
}

const initialState: ITopicState = {
  topic: '',
};

export const topicSlice = createSlice({
  name: "post_topic",
  initialState,
  reducers: {
    setTopic: (state, action: PayloadAction<string>) => {
      state.topic = action.payload;
    }
  },
});

export const { setTopic } = topicSlice.actions;

export default topicSlice.reducer;
