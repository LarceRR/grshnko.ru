import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { TelegramChannel, defaultChannel } from "../types/telegram-channel";

interface SelectedChannelState {
  channel: TelegramChannel;
}

const initialState: SelectedChannelState = {
  channel: defaultChannel,
};

const selectedChannelSlice = createSlice({
  name: "selectedChannel",
  initialState,
  reducers: {
    setActiveChannel: (state, action: PayloadAction<TelegramChannel>) => {
      state.channel = action.payload;
    },
  },
});

export const { setActiveChannel } = selectedChannelSlice.actions;

export default selectedChannelSlice.reducer;

