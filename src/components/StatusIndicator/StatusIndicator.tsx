import "./StatusIndicator.scss";

interface IStatusIndicatorProps {
  status: "ENABLED" | "DISABLED" | "ERROR" | "WARNING" | "INFO";
}

const StatusIndicator: React.FC<IStatusIndicatorProps> = ({ status }) => {
  return {
    ENABLED: <span className="status-indicator enabled"></span>,
    DISABLED: <span className="status-indicator disabled"></span>,
    ERROR: <span className="status-indicator error"></span>,
    WARNING: <span className="status-indicator warning"></span>,
    INFO: <span className="status-indicator info"></span>,
  }[status];
};

export default StatusIndicator;
