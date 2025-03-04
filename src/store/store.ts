// src/store/store.ts
import { configureStore } from "@reduxjs/toolkit";
import topicReducer from "../features/currentTopic"; // Import reducers

export const store = configureStore({
  reducer: {
    topic: topicReducer, // Add reducers here
  },
});

// Infer types for RootState and AppDispatch
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
