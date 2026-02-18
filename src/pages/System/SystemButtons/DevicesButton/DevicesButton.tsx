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
    <div className="user-list-button" onClick={() => navigate("/devices")}>
      {isLoading && <LoadingBannerNoText />}
      {isError && <span style={{ color: "red" }}>Ошибка загрузки</span>}
      {!isLoading && !isError && (
        <div>
          <div className="centered">
            <Smartphone size={34} />
          </div>
          <div className="centered">
            <span
              style={{
                fontSize: "22px",
                textAlign: "center",
              }}
            >
              {count}
              <br></br>
              <span
                style={{
                  fontSize: "16px",
                  textAlign: "center",
                  opacity: 0.5,
                }}
              >
                Всего
              </span>
            </span>
          </div>
          <div
            className="centered"
            style={{
              gridColumn: "span 2",
            }}
          >
            <span
              style={{
                fontSize: "14px",
                height: "fit-content",
                textAlign: "center",
                marginTop: "10px",
              }}
            >
              Устройства
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DevicesButton;
