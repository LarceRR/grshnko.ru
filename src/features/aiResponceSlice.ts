import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface IAiResponseState {
  ai_response: string,
  ai_loading: boolean,
  ai_error: string,
  ai_isAlreadyAsked: boolean,
  ai_isMarkdownLocked: boolean
}

const initialState: IAiResponseState = {
  ai_response: '',
  ai_loading: false,
  ai_error: '',
  ai_isAlreadyAsked: false,
  ai_isMarkdownLocked: true
}

export const ai_responseSlice = createSlice({
  name: "ai_ai_response",
  initialState,
  reducers: {
    setAiResponse: (state, action: PayloadAction<string>) => {
      state.ai_response = action.payload;
    },
    setAiLoading: (state, action: PayloadAction<boolean>) => {
      state.ai_loading = action.payload
    },
    setAiError: (state, action: PayloadAction<string>) => {
      state.ai_error = action.payload
    },
    setIsAiAlreadyAsked: (state, action: PayloadAction<boolean>) => {
      state.ai_isAlreadyAsked = action.payload
    },
    setAiIsMarkdownLocked: (state, action: PayloadAction<boolean>) => {
      state.ai_isMarkdownLocked = action.payload
    }
  },
});

export const { setAiResponse, setAiLoading, setAiError, setIsAiAlreadyAsked, setAiIsMarkdownLocked } = ai_responseSlice.actions;

export default ai_responseSlice.reducer;
