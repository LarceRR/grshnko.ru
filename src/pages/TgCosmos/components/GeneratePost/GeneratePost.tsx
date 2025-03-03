import { Button, Checkbox, Input } from "antd";
import "./GeneratePost.scss";
import { Ellipsis } from "lucide-react";

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
          <div className="generate-post-button-splitter">
            <Button type="primary" className="generate-post-button">
              Создать новую тему
            </Button>
            <Checkbox className="checkbox"></Checkbox>
          </div>
        </div>
        <div className="generate-post-buttons">
          <p>Задать характер</p>
          <TextArea
            showCount
            className="generate-post-input"
            maxLength={136}
            style={{ height: "150px", resize: "none" }}
          />
        </div>
      </div>
      <div className="divider"></div>
      <div className="generate-post-result">
        <div className="generate-post-result__header">
          <p>Ответ нейросети</p>
          <div className="generate-post-result__header-buttons">
            <Button className="create-new-post">Сгенерировать пост</Button>
            <Ellipsis />
          </div>
        </div>
        <TextArea
          showCount
          className="generate-post-input"
          maxLength={1500}
          style={{ resize: "none" }}
          disabled
        />
      </div>
    </div>
  );
};

export default GeneratePost;
