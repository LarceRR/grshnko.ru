// src/store/store.ts
import { configureStore } from "@reduxjs/toolkit";
import topicReducer from "../features/currentTopicSlice"; // Import reducers
import imagesReducer from "../features/imagesSlice";
import characterReducer from "../features/characterSlice";
import ai_responseSlice from "../features/aiResponceSlice";
import serverStatusSlice from "../features/systemStatusSlice";
import tabSlice from "../features/tabsSlide";
import currentVideoSlice from "../features/currentVideoSlice";
import selectedChannelSlice from "../features/selectedChannelSlice";
import chatReducer from "../features/chatSlice";

export const store = configureStore({
  reducer: {
    topic: topicReducer, // Add reducers here
    images: imagesReducer,
    character: characterReducer,
    ai_response: ai_responseSlice,
    serverStatus: serverStatusSlice,
    currentTab: tabSlice,
    currentVideo: currentVideoSlice,
    selectedChannel: selectedChannelSlice,
    chat: chatReducer,
  },
});

// Infer types for RootState and AppDispatch
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
