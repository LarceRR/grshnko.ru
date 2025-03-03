import { Button, Input } from "antd";
import "./GeneratePost.scss";

const { TextArea } = Input;

const GeneratePost = () => {
  return (
    <div className="generate-post-wrapper">
      <div className="generate-post-control">
        <div className="generate-post-buttons">
          <p>Тема не выбрана</p>
          <Button type="primary" className="generate-post-button">
            Выбрать тему
          </Button>
          <Button type="primary" className="generate-post-button">
            Выбрать вручную
          </Button>
        </div>
        <div className="generate-post-buttons">
          <p>Задать характер</p>
          <TextArea
            showCount
            className="generate-post-input"
            maxLength={136}
            style={{ height: "105px", resize: "none" }}
          />
        </div>
      </div>
      <div className="divider"></div>
      <div className="generate-post-result">
        <p>Ответ нейросети</p>
        <TextArea
          showCount
          className="generate-post-input"
          maxLength={136}
          style={{ resize: "none" }}
        />
      </div>
    </div>
  );
};

export default GeneratePost;
