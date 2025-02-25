import { useState } from "react";
import { SimpleTextArea } from "./custom-components/custom-input";

export const DSGenerator = () => {
  const [responseText, setResponseText] = useState<string>("");
  const [inputText, setInputText] = useState<string>("");
  const [personality, setPersonality] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const fetchStream = async () => {
    setResponseText("");
    setLoading(true);
    4;
    try {
      const response = await fetch(
        `http://162.248.224.199:3000/api/generate?message=${inputText}&personality=${personality}&generatorType=custom`
      );

      if (!response.body) {
        throw new Error("ReadableStream не поддерживается в этом браузере.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      reader.read().then(function processText({ done, value }) {
        if (done) {
          setLoading(false);
          return;
        }
        const chunk = decoder.decode(value);
        setResponseText((prev) => prev + chunk);
        reader.read().then(processText);
      });
    } catch (error) {
      console.error("Ошибка при запросе:", error);
      setResponseText("Ошибка загрузки данных.");
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Сам текст</h1>
      <SimpleTextArea setText={setInputText} text={inputText} />
      <h1>Характер</h1>
      <SimpleTextArea setText={setPersonality} text={personality} />
      <button
        onClick={fetchStream}
        disabled={loading}
        style={{ marginBottom: 10 }}
      >
        {loading ? "Загрузка..." : "Запросить ответ"}
      </button>
      <button
        onClick={() => navigator.clipboard.writeText(responseText)}
        style={{ cursor: loading ? "not-allowed" : "pointer" }}
      >
        copy
      </button>
      <p style={{ whiteSpace: "pre-wrap", width: "400px", lineHeight: "1.5" }}>
        {responseText === "" ? "Здесь будет ответ от сервера." : responseText}
      </p>
    </div>
  );
};
