import React, { createContext, useContext, ReactNode } from "react";

interface ChatActionContextType {
  sendMessage: (content: string, modelOverride?: string) => void;
  editMessage: (messageId: string, content: string, modelOverride?: string) => void;
  regenerateMessage: (messageId: string) => void;
  stopGeneration: () => void;
  onEdit: (messageId: string) => void;
  onCopy: (content: string) => void;
  onNavigateBranch: (messageId: string, branchIndex: number) => void;
  onSubmitEdit: (messageId: string, content: string) => void;
  onCancelEdit: () => void;
  onQuestionnaireSelect: (option: any) => void;
  onQuestionnaireSubmit: (text: string) => void;
  onQuestionnaireSkip: () => void;
}

const ChatActionContext = createContext<ChatActionContextType | undefined>(undefined);

export const useChatActions = () => {
  const context = useContext(ChatActionContext);
  if (!context) {
    throw new Error("useChatActions must be used within a ChatActionProvider");
  }
  return context;
};

interface ChatActionProviderProps extends ChatActionContextType {
  children: ReactNode;
}

export const ChatActionProvider: React.FC<ChatActionProviderProps> = ({ children, ...actions }) => {
  return (
    <ChatActionContext.Provider value={actions}>
      {children}
    </ChatActionContext.Provider>
  );
};
