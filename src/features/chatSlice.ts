import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { QuestionnaireData } from "../types/chat.types";

interface ChatState {
  activeSessionId: string | null;
  questionnaire: QuestionnaireData | null;
  /** Session for which questionnaire is shown; when switching chats we hide if mismatch */
  questionnaireSessionId: string | null;
  isStreaming: boolean;
}

const initialState: ChatState = {
  activeSessionId: null,
  questionnaire: null,
  questionnaireSessionId: null,
  isStreaming: false,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setActiveSessionId: (state, action: PayloadAction<string | null>) => {
      state.activeSessionId = action.payload;
    },
    setChatQuestionnaire: (
      state,
      action: PayloadAction<{ questionnaire: QuestionnaireData | null; sessionId: string | null }>,
    ) => {
      state.questionnaire = action.payload.questionnaire;
      state.questionnaireSessionId = action.payload.sessionId;
    },
    setIsStreaming: (state, action: PayloadAction<boolean>) => {
      state.isStreaming = action.payload;
    },
  },
});

export const { setActiveSessionId, setChatQuestionnaire, setIsStreaming } = chatSlice.actions;
export default chatSlice.reducer;
