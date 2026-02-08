import { Cpu } from "lucide-react";
import { useNavigate } from "react-router";
import "./OtaButton.scss";

const OtaButton = () => {
  const navigate = useNavigate();

  return (
    <div className="system-grid-button" onClick={() => navigate("/ota")}>
      <div>
        <div className="centered">
          <Cpu size={34} />
        </div>
        <div className="centered">
          <span className="system-grid-button__number">—</span>
          <br />
          <span className="system-grid-button__label-small">Прошивки</span>
        </div>
        <div className="centered system-grid-button__title-wrap">
          <span className="system-grid-button__title">OTA</span>
        </div>
      </div>
    </div>
  );
};

export default OtaButton;
