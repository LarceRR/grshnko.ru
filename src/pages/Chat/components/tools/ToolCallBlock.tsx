import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ToolCallHeader } from "./ToolCallHeader";
import { ToolCallDetails } from "./ToolCallDetails";
import { AnimationPreview } from "./AnimationPreview";
import { ThemePreview } from "./ThemePreview";
import { QuestionnaireCards } from "./QuestionnaireCards";
import type {
  QuestionnaireData,
  QuestionnaireOption,
} from "../../../../types/chat.types";
import "./ToolCallBlock.scss";

export interface ToolResultData {
  result?: unknown;
  isError?: boolean;
  displayType?: string;
  displayData?: unknown;
}

interface ToolCallBlockProps {
  toolName: string;
  arguments: Record<string, unknown>;
  result?: ToolResultData["result"];
  status: "running" | "done" | "error";
  displayType?: string;
  displayData?: unknown;
  /** Questionnaire data for inline rendering (only passed to questionnaire tool calls) */
  questionnaire?: QuestionnaireData | null;
  onQuestionnaireSelect?: (option: QuestionnaireOption) => void;
  onQuestionnaireSubmit?: (text: string) => void;
  onQuestionnaireSkip?: () => void;
}

export const ToolCallBlock: React.FC<ToolCallBlockProps> = ({
  toolName,
  arguments: args,
  result,
  status,
  displayType,
  displayData,
  questionnaire,
  onQuestionnaireSelect,
  onQuestionnaireSubmit,
  onQuestionnaireSkip,
}) => {
  const [expanded, setExpanded] = useState(false);

  const questionnaireDisplayData = displayData as
    | Record<string, unknown>
    | undefined;
  const submittedText = questionnaireDisplayData?.submittedText;
  const hasUserAnswer =
    displayType === "questionnaire" &&
    submittedText != null &&
    String(submittedText).trim() !== "";

  return (
    <div className="tool-call-block">
      <ToolCallHeader
        toolName={toolName}
        status={status}
        expanded={expanded}
        onToggle={() => setExpanded((e) => !e)}
      />
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="tool-call-block__details"
          >
            <ToolCallDetails
              args={args}
              result={result}
              isError={status === "error"}
            />
          </motion.div>
        )}
      </AnimatePresence>
      {displayType === "animation" && displayData ? (
        <AnimationPreview data={displayData as Record<string, unknown>} />
      ) : null}
      {displayType === "theme" && displayData ? (
        <ThemePreview data={displayData as Record<string, unknown>} />
      ) : null}
      {hasUserAnswer ? (
        <div className="tool-call-block__questionnaire-result">
          <span className="tool-call-block__questionnaire-result-label">
            Ответ:
          </span>{" "}
          {String(submittedText)}
        </div>
      ) : null}
      {questionnaire &&
        (questionnaire.options?.length > 0 || questionnaire.groups?.length) &&
        (onQuestionnaireSelect || onQuestionnaireSubmit) &&
        !hasUserAnswer && (
          <QuestionnaireCards
            question={questionnaire.question}
            options={questionnaire.options}
            groups={questionnaire.groups}
            onSelect={onQuestionnaireSelect ?? (() => {})}
            onSubmit={onQuestionnaireSubmit}
            onSkip={onQuestionnaireSkip}
            disabled={false}
          />
        )}
    </div>
  );
};
