import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type {
  QuestionnaireOption,
  QuestionnaireGroup,
} from "../../../../types/chat.types";
import "./QuestionnaireCards.scss";

export type { QuestionnaireOption };

interface QuestionnaireCardsProps {
  question?: string;
  options: QuestionnaireOption[];
  groups?: QuestionnaireGroup[];
  onSelect: (option: QuestionnaireOption) => void;
  /** When multiple groups: called with full answer text when user clicks Submit */
  onSubmit?: (text: string) => void;
  /** When multiple groups: called when user clicks Skip */
  onSkip?: () => void;
  disabled?: boolean;
  selectedTitle?: string | null;
}

function OptionCard({
  option,
  index,
  isSelected,
  disabled,
  onSelect,
}: {
  option: QuestionnaireOption;
  index: number;
  isSelected: boolean;
  disabled?: boolean;
  onSelect: (option: QuestionnaireOption) => void;
}) {
  return (
    <motion.button
      key={index}
      type="button"
      className={`questionnaire-cards__card ${disabled ? "questionnaire-cards__card--disabled" : ""} ${isSelected ? "questionnaire-cards__card--selected" : ""}`}
      onClick={() => !disabled && onSelect(option)}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
    >
      {option.image && (
        <img
          src={option.image}
          alt=""
          className="questionnaire-cards__card-img"
        />
      )}
      <span className="questionnaire-cards__card-title">{option.title}</span>
      {option.description && (
        <p className="questionnaire-cards__card-desc">{option.description}</p>
      )}
    </motion.button>
  );
}

/** Build final answer text from selections and skipped groups */
function buildSubmitText(
  groups: QuestionnaireGroup[],
  selections: (string | string[] | null)[],
  skipped: Set<number>,
): string {
  const parts: string[] = [];
  groups.forEach((g, i) => {
    const label = g.label || g.question || `Вопрос ${i + 1}`;
    if (skipped.has(i)) {
      parts.push(`${label}: Пропущено`);
      return;
    }
    const sel = selections[i];
    if (sel == null) return;
    if (Array.isArray(sel)) {
      parts.push(`${label}: ${sel.join(", ")}`);
    } else {
      parts.push(`${label}: ${sel}`);
    }
  });
  return parts.join("\n\n");
}

export const QuestionnaireCards: React.FC<QuestionnaireCardsProps> = ({
  question,
  options,
  groups,
  onSelect,
  onSubmit,
  onSkip,
  disabled,
  selectedTitle,
}) => {
  const useGroups = Array.isArray(groups) && groups.length > 0;
  const isSlider = useGroups && groups!.length > 1;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selections, setSelections] = useState<(string | string[] | null)[]>(
    () => (useGroups ? groups!.map(() => null) : []),
  );
  const [skipped, setSkipped] = useState<Set<number>>(() => new Set());

  const currentGroup = isSlider ? groups![currentIndex] : null;
  const isMultiselect = currentGroup?.type === "multiselect";
  const currentSelection = currentGroup ? selections[currentIndex] : null;
  const currentAnswered =
    currentGroup &&
    (skipped.has(currentIndex) ||
      (Array.isArray(currentSelection)
        ? currentSelection.length > 0
        : currentSelection != null && currentSelection !== ""));

  const goNext = useCallback(() => {
    if (!isSlider || currentIndex >= groups!.length - 1) return;
    setCurrentIndex((i) => i + 1);
  }, [isSlider, currentIndex, groups?.length]);

  const goPrev = useCallback(() => {
    if (!isSlider || currentIndex <= 0) return;
    setCurrentIndex((i) => i - 1);
  }, [isSlider, currentIndex]);

  const handleSelectInSlider = useCallback(
    (option: QuestionnaireOption, groupIndex: number) => {
      const g = groups![groupIndex];
      if (g?.type === "multiselect") {
        setSelections((prev) => {
          const arr = (prev[groupIndex] as string[] | null) ?? [];
          const next = [...prev];
          const title = option.title ?? option.value ?? "";
          if (arr.includes(title)) {
            next[groupIndex] = arr.filter((t) => t !== title);
          } else {
            next[groupIndex] = [...arr, title];
          }
          return next;
        });
      } else {
        setSelections((prev) => {
          const next = [...prev];
          next[groupIndex] = option.title ?? option.value ?? "";
          return next;
        });
        if (groupIndex < groups!.length - 1) {
          setCurrentIndex((i) => i + 1);
        }
      }
    },
    [groups],
  );

  const handleSkipCurrent = useCallback(() => {
    setSkipped((s) => new Set(s).add(currentIndex));
    if (currentIndex < groups!.length - 1) {
      setCurrentIndex((i) => i + 1);
    }
  }, [currentIndex, groups?.length]);

  const handleSubmit = useCallback(() => {
    if (!onSubmit || !groups?.length) return;
    const text = buildSubmitText(groups, selections, skipped);
    onSubmit(text);
  }, [onSubmit, groups, selections, skipped]);

  const allDone =
    isSlider &&
    groups!.length > 0 &&
    currentIndex === groups!.length - 1 &&
    currentAnswered;

  if (isSlider && groups!.length > 0) {
    return (
      <div className="questionnaire-cards questionnaire-cards--slider">
        {question && (
          <p className="questionnaire-cards__question">{question}</p>
        )}

        <div className="questionnaire-cards__nav">
          <button
            type="button"
            className="questionnaire-cards__nav-arrow"
            onClick={goPrev}
            disabled={currentIndex === 0 || disabled}
            aria-label="Предыдущий вопрос"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="questionnaire-cards__nav-counter">
            {currentIndex + 1} / {groups!.length}
          </span>
          <button
            type="button"
            className="questionnaire-cards__nav-arrow"
            onClick={goNext}
            disabled={
              !currentAnswered || currentIndex >= groups!.length - 1 || disabled
            }
            aria-label="Следующий вопрос"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {currentGroup && (
            <motion.div
              key={currentIndex}
              className="questionnaire-cards__section"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {(currentGroup.label || currentGroup.question) && (
                <p className="questionnaire-cards__section-title">
                  {currentGroup.label || currentGroup.question}
                </p>
              )}
              {currentGroup.question &&
                currentGroup.label !== currentGroup.question && (
                  <p className="questionnaire-cards__section-desc">
                    {currentGroup.question}
                  </p>
                )}
              <div className="questionnaire-cards__grid">
                {currentGroup.options.map(
                  (option: QuestionnaireOption, i: number) => {
                    const sel = selections[currentIndex];
                    const isSelected = isMultiselect
                      ? Array.isArray(sel) &&
                        sel.includes(option.title ?? option.value ?? "")
                      : sel === (option.title ?? option.value);
                    return (
                      <OptionCard
                        key={i}
                        option={option}
                        index={i}
                        isSelected={!!isSelected}
                        disabled={disabled}
                        onSelect={(opt) =>
                          handleSelectInSlider(opt, currentIndex)
                        }
                      />
                    );
                  },
                )}
              </div>
              <div className="questionnaire-cards__section-actions">
                <button
                  type="button"
                  className="questionnaire-cards__btn questionnaire-cards__btn--secondary"
                  onClick={handleSkipCurrent}
                  disabled={disabled}
                >
                  Пропустить вопрос
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {allDone && (
          <div className="questionnaire-cards__submit-bar">
            <button
              type="button"
              className="questionnaire-cards__btn questionnaire-cards__btn--primary"
              onClick={handleSubmit}
              disabled={disabled}
            >
              Отправить
            </button>
            {onSkip && (
              <button
                type="button"
                className="questionnaire-cards__btn questionnaire-cards__btn--secondary"
                onClick={onSkip}
                disabled={disabled}
              >
                Пропустить
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  if (useGroups && groups!.length === 1) {
    const group = groups![0];
    return (
      <div className="questionnaire-cards">
        {question && (
          <p className="questionnaire-cards__question">{question}</p>
        )}
        <div className="questionnaire-cards__section">
          {(group.label || group.question) && (
            <p className="questionnaire-cards__section-title">
              {group.label || group.question}
            </p>
          )}
          {group.question && group.label !== group.question && (
            <p className="questionnaire-cards__section-desc">
              {group.question}
            </p>
          )}
          <div className="questionnaire-cards__grid">
            {group.options.map((option: QuestionnaireOption, i: number) => (
              <OptionCard
                key={i}
                option={option}
                index={i}
                isSelected={
                  selectedTitle != null && option.title === selectedTitle
                }
                disabled={disabled}
                onSelect={onSelect}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="questionnaire-cards">
      {question && <p className="questionnaire-cards__question">{question}</p>}
      <div className="questionnaire-cards__grid">
        {options.map((option, i) => (
          <OptionCard
            key={i}
            option={option}
            index={i}
            isSelected={selectedTitle != null && option.title === selectedTitle}
            disabled={disabled}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
};
