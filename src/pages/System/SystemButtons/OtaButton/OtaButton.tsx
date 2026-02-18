import { Cpu } from "lucide-react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { getOtaCount } from "../../../../api/ota";
import LoadingBannerNoText from "../../../../components/LoadingBanner/LoadingNoText";
import "./OtaButton.scss";

const OtaButton = () => {
  const navigate = useNavigate();
  const {
    data: count,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["otaCount"],
    queryFn: getOtaCount,
    retry: false,
  });

  return (
    <div className="user-list-button" onClick={() => navigate("/ota")}>
      {isLoading && <LoadingBannerNoText />}
      {isError && <span style={{ color: "red" }}>Ошибка загрузки</span>}
      {!isLoading && !isError && typeof count === "number" && (
        <div>
          <div className="centered">
            <Cpu size={34} />
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
              OTA
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default OtaButton;
