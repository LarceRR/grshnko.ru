import React from "react";
import HighlightedText from "../../../../../components/HighlightedText/HighlightedText";
import { useSelector } from "react-redux";
import { RootState } from "../../../../../store/store";

interface IServerStatusProps {}

const ServerStatus: React.FC<IServerStatusProps> = () => {
  const { serverStatus } = useSelector(
    (state: RootState) => state.serverStatus
  );

  return (
    <div className="status-item">
      <span>Статус:</span>
      <HighlightedText
        state={serverStatus?.telegram.telegram_client_status ?? false}
      ></HighlightedText>
    </div>
  );
};

export default ServerStatus;
