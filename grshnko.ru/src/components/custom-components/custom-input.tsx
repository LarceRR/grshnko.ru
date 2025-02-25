import React, { Dispatch, SetStateAction, useState } from "react";

type ResizableTextAreaProps = {
  setText: Dispatch<SetStateAction<string>>;
  text: string;
};

export const SimpleTextArea: React.FC<ResizableTextAreaProps> = ({
  setText,
  text,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  return (
    <div style={{ width: "300px", marginBottom: "20px" }}>
      <textarea
        value={text}
        onChange={handleChange}
        rows={4}
        style={{
          maxWidth: "350px",
          width: "100%",
          padding: "8px",
          boxSizing: "border-box",
          border: "1px solid #ccc",
          borderRadius: "4px",
          fontSize: "16px",
        }}
      />
    </div>
  );
};
