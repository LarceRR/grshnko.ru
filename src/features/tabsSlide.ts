// src/features/counterSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ITabState {
  tab: string
}

const initialState: ITabState = {
  tab: ''
}

export const tabSlice = createSlice({
  name: "tabs",
  initialState,
  reducers: {
    setCurrentTab: (state, action: PayloadAction<string>) => {
      state.tab = action.payload;
    }
  },
});

export const { setCurrentTab } = tabSlice.actions;

export default tabSlice.reducer;
