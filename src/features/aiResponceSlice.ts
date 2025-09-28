import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Entity } from "../components/MarkdownEditor/MarkdownEditor";

interface IAiResponseState {
  ai_response: string,
  ai_loading: boolean,
  ai_error: string,
  post_entities: Entity[]
  ai_isAlreadyAsked: boolean,
}

const initialState: IAiResponseState = {
  ai_response: '',
  ai_loading: false,
  ai_error: '',
  ai_isAlreadyAsked: false,
  post_entities: []
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
    setPostEntities: (state, action: PayloadAction<Entity[]>) => {
      state.post_entities = action.payload
    }
  },
});

export const { setAiResponse, setAiLoading, setAiError, setIsAiAlreadyAsked, setPostEntities } = ai_responseSlice.actions;

export default ai_responseSlice.reducer;
