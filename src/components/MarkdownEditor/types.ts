export type Entity =
  | {
      type:
        | "bold"
        | "italic"
        | "underline"
        | "strikethrough"
        | "spoiler"
        | "code";
      offset: number;
      length: number;
    }
  | { type: "text_url"; offset: number; length: number; url: string };

export interface HistoryState {
  text: string;
  entities: Entity[];
}

export interface MarkdownEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  onEntitiesChange?: (entities: Entity[]) => void;
  videoSourceUrl?: string;
  channelUrl?: string;
  /**
   * Ответ от AI для автоматического обновления текста
   * При изменении этого пропа текст будет обновляться без добавления в историю
   */
  aiResponse?: string;
  /**
   * Флаг, указывающий что идет генерация AI ответа
   * Позволяет оптимизировать обновления во время streaming
   */
  isAiGenerating?: boolean;
}

