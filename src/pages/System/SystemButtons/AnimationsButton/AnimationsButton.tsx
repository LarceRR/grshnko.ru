import { Sparkles } from "lucide-react";
import { useNavigate } from "react-router";
import "./AnimationsButton.scss";

const AnimationsButton = () => {
  const navigate = useNavigate();

  return (
    <div className="system-grid-button" onClick={() => navigate("/animations")}>
      <div>
        <div className="centered">
          <Sparkles size={34} />
        </div>
        <div className="centered">
          <span className="system-grid-button__number">—</span>
          <br />
          <span className="system-grid-button__label-small">LED-анимации</span>
        </div>
        <div className="centered system-grid-button__title-wrap">
          <span className="system-grid-button__title">Анимации</span>
        </div>
      </div>
    </div>
  );
};

export default AnimationsButton;
