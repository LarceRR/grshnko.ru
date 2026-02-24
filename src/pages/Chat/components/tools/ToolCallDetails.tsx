import React from "react";
import "./ToolCallDetails.scss";

interface ToolCallDetailsProps {
  args: Record<string, unknown>;
  result?: unknown;
  isError?: boolean;
}

export const ToolCallDetails: React.FC<ToolCallDetailsProps> = ({
  args,
  result,
  isError,
}) => {
  return (
    <div className="tool-call-details">
      {Object.keys(args).length > 0 && (
        <section className="tool-call-details__section">
          <div className="tool-call-details__label">Параметры</div>
          <pre className="tool-call-details__json">
            {JSON.stringify(args, null, 2)}
          </pre>
        </section>
      )}
      {result !== undefined && (
        <section className="tool-call-details__section">
          <div className="tool-call-details__label">
            {isError ? "Ошибка" : "Результат"}
          </div>
          <pre
            className={`tool-call-details__json ${isError ? "tool-call-details__json--error" : ""}`}
          >
            {typeof result === "object"
              ? JSON.stringify(result, null, 2)
              : String(result)}
          </pre>
        </section>
      )}
    </div>
  );
};
