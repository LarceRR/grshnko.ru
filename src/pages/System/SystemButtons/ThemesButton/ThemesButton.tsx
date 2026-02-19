import { Palette } from "lucide-react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { getThemes } from "../../../../api/themes";
import LoadingBannerNoText from "../../../../components/LoadingBanner/LoadingNoText";
import "./ThemesButton.scss";

const ThemesButton = () => {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["themesCount"],
    queryFn: () => getThemes({ take: 1, amountOnly: "true" }),
    retry: false,
  });

  const count =
    typeof data === "object" && data !== null && "count" in data
      ? (data as { count: number }).count
      : 0;

  return (
    <div className="themes-button" onClick={() => navigate("/system/themes")}>
      {isLoading && <LoadingBannerNoText />}
      {isError && <span style={{ color: "red" }}>Ошибка</span>}
      {!isLoading && !isError && (
        <div>
          <div className="centered">
            <Palette size={34} />
          </div>
          <div className="centered">
            <span className="themes-button__number">{count}</span>
            <span className="themes-button__label">Тем</span>
          </div>
          <div className="centered themes-button__title">
            <span>Темы сайта</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemesButton;
