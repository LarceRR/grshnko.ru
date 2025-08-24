// src/features/currentVideoSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { IChannelInfo } from "../types/tiktok";

interface IVideoState {
  videos: IChannelInfo[];
  loading: boolean;
  error: string;
  selectedVideos: IChannelInfo[];
}

const initialState: IVideoState = {
  videos: [],
  loading: false,
  error: "",
  selectedVideos: [],
};

export const currentVideoSlice = createSlice({
  name: "video_info",
  initialState,
  reducers: {
    setVideos: (state, action: PayloadAction<IChannelInfo[]>) => {
      state.videos = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    setSelectedVideos: (state, action: PayloadAction<IChannelInfo[]>) => {
      state.selectedVideos = action.payload;
    },
  },
});

export const { setVideos, setLoading, setError, setSelectedVideos } =
  currentVideoSlice.actions;

export default currentVideoSlice.reducer;
