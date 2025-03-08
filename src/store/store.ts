// src/store/store.ts
import { configureStore } from "@reduxjs/toolkit";
import topicReducer from "../features/currentTopic"; // Import reducers
import imagesReducer from "../features/images";
import characterReducer from "../features/character";
import ai_responseSlice from "../features/ai_response";

export const store = configureStore({
  reducer: {
    topic: topicReducer, // Add reducers here
    images: imagesReducer,
    character: characterReducer,
    ai_response: ai_responseSlice
  },
});

// Infer types for RootState and AppDispatch
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
