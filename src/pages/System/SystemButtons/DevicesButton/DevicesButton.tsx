import { getDevices } from "../../../../api/devices";
import { useQuery } from "@tanstack/react-query";
import { Smartphone } from "lucide-react";
import { useNavigate } from "react-router";
import LoadingBannerNoText from "../../../../components/LoadingBanner/LoadingNoText";
import "./DevicesButton.scss";

const DevicesButton = () => {
  const navigate = useNavigate();
  const {
    data: devices,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["devices"],
    queryFn: getDevices,
    retry: false,
  });

  const count = Array.isArray(devices) ? devices.length : 0;

  return (
    <div className="system-grid-button" onClick={() => navigate("/devices")}>
      {isLoading && <LoadingBannerNoText />}
      {isError && <span style={{ color: "red" }}>Ошибка загрузки</span>}
      {!isLoading && !isError && (
        <div>
          <div className="centered">
            <Smartphone size={34} />
          </div>
          <div className="centered">
            <span className="system-grid-button__number">{count}</span>
            <br />
            <span className="system-grid-button__label-small">Всего</span>
          </div>
          <div className="centered system-grid-button__title-wrap">
            <span className="system-grid-button__title">Устройства</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DevicesButton;
