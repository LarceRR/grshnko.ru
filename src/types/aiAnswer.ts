import { RefObject } from "react";

export interface AiAnswerProps {}

export interface GenerateButtonConfig {
  text?: string;
  icon?: React.ReactNode;
  style?: React.CSSProperties;
  loading?: boolean;
}

export interface AiResponseEditProps {
  content: string;
  wrapperRef: RefObject<HTMLDivElement | null>;
  onChange: (value: string) => void;
  onBlur: () => void;
  isEditing?: boolean;
}

export interface UseAiAnswerReturn {
  aiResponse: string;
  isLoading: boolean;
  isError: boolean;
  isMarkdownLocked: boolean;
  isEditing: boolean;
  handleGenerate: () => void;
  handleToggleEdit: () => void;
  handleTextChange: (value: string) => void;
  buttonConfig: GenerateButtonConfig;
}