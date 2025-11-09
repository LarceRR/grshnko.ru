import { Button, Select } from "antd";
import React, { Dispatch } from "react";
import { AIModelType, rawData } from "./ai-models-array";
import "./AiAnswer.scss";
import AiModelItem from "./AiModelItem";
import { ChevronDown } from "lucide-react";
import TextArea from "antd/es/input/TextArea";

interface IAiPromptTextAreaProps {
  setAiPrompt: (prompt: string) => void;
  aiPrompt: string;
  modalToggler: Dispatch<React.SetStateAction<boolean>>;
  generatePost: () => void;
  setModel: (model: AIModelType) => void;
  selectedModel: AIModelType;
}

const AiPromptTextArea: React.FC<IAiPromptTextAreaProps> = ({
  setAiPrompt,
  aiPrompt,
  modalToggler,
  generatePost,
  setModel,
  selectedModel,
}) => {
  // Сортируем модели по популярности (по убыванию)
  const sortedData = [...rawData].sort(
    (a, b) => ((b.popularity as number) ?? 0) - ((a.popularity as number) ?? 0)
  );

  const options = sortedData.map((item: AIModelType) => ({
    label: (
      <AiModelItem
        modelId={item.modelId}
        text={item.text}
        popularity={item.popularity ?? 0}
        icon={(item.popularity ?? 0) >= 4 ? "Популярное" : ""}
      />
    ),
    value: item.modelId,
    text: item.text, // для поиска
  }));

  return (
    <div className="ai-prompt-textarea-wrapper">
      <h6>Выберите модель (только бесплатные)</h6>
      <Select
        value={selectedModel?.modelId || undefined}
        onChange={(value) => {
          const model = sortedData.find((item) => item.modelId === value);
          if (model) {
            setModel(model);
          }
        }}
        showSearch
        filterOption={(input, option) =>
          (option?.text as string).toLowerCase().includes(input.toLowerCase())
        }
        style={{ width: "100%", backgroundColor: "var(--input-background)" }}
        suffixIcon={<ChevronDown />}
        dropdownRender={(menu) => <div>{menu}</div>}
        optionLabelProp="text"
      >
        {options.map((item) => (
          <Select.Option key={item.value} value={item.value} text={item.text}>
            {item.label}
          </Select.Option>
        ))}
      </Select>

      <span className="ai-prompt-textarea__info">
        Если генерация не происходит на протяжении длительного времени - смените
        модель. <br />
        (Качество ответа меняется в зависимости от модели и может выдавать
        ошибки)
      </span>
      <h6>Введите промпт</h6>
      <TextArea
        value={aiPrompt}
        showCount
        maxLength={5000}
        onChange={(e) => setAiPrompt(e.target.value)}
        className="generate-post-input"
        autoSize={{ minRows: 6, maxRows: 12 }}
      />
      <Button
        onClick={() => {
          modalToggler(false);
          generatePost();
        }}
      >
        Сгенерировать пост
      </Button>
    </div>
  );
};

export default AiPromptTextArea;
