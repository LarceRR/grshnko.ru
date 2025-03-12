import "./DashboardHeader.scss";
import HighlightedText from "../../../../components/HighlightedText/HighlightedText";
import { Button, Input } from "antd";
import { Ellipsis, Eye } from "lucide-react";
import { useWindowSize } from "../../../../hooks/useWindowSize";

const DashboardHeader = () => {
  const { size } = useWindowSize();

  if (size[0] > 1028) {
    return (
      <div className="dashboard-block-wrapper">
        <div className="status-item">
          <span>Статус:</span>
          <HighlightedText color="#ff0000">Онлайн</HighlightedText>
        </div>
        <div className="divider"></div>
        <div className="popular-post-item">
          <span>Тема: ДОБАВИТЬ ОТОБРАЖЕНИЕ ТЕМЫ</span>
          <div className="post">
            <div className="input-wrapper">
              <Input
                value="Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua"
                className="input"
                disabled
                maxLength={50}
              />
            </div>
            <div className="views">
              <Eye width={20} />
              <span>567К</span>
            </div>
          </div>
        </div>
        <div className="divider"></div>
        <div>
          <Ellipsis />
        </div>
      </div>
    );
  } else {
    return (
      <div className="dashboard-block-wrapper">
        <div className="popular-post-item">
          <span>Тема: ОТОБРАЖЕНИЕ ТЕМЫ ЗДЕСЬ</span>
          <div className="post">
            <div className="input-wrapper">
              <Input
                value="Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua"
                className="input"
                disabled
                maxLength={50}
              />
            </div>
            <div className="views">
              <Eye width={20} />
              <span>567К</span>
            </div>
          </div>
        </div>
        <div className="dashboard-additional-buttons">
          <Button className="dashboard-additional-button" disabled>
            Показать все посты(999999)
          </Button>
          <Button className="dashboard-additional-button" disabled>
            Показать отложенные посты(999999)
          </Button>
        </div>
      </div>
    );
  }
};

export default DashboardHeader;
