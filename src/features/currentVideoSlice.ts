// src/features/counterSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { IChannelInfo } from "../types/tiktok";

interface IVideoState {
  video: IChannelInfo
}

const initialState: IVideoState = {
  video: {
    username: "",
    channelUrl: "",
    fullUrl: "",
    error: ""
  },
}

export const currentVideoSlice = createSlice({
  name: "video_info",
  initialState,
  reducers: {
    setVideo: (state, action: PayloadAction<IChannelInfo>) => {
      state.video = action.payload;
    }
  },
});

export const { setVideo } = currentVideoSlice.actions;

export default currentVideoSlice.reducer;
