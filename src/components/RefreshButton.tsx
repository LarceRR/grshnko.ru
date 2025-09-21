// components/RefreshButton.tsx
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCcw } from "lucide-react";

interface RefreshButtonProps {
  queryKey: any[];
  countdown?: number;
}

const RefreshButton = ({ queryKey, countdown = 5 }: RefreshButtonProps) => {
  const queryClient = useQueryClient();
  const [seconds, setSeconds] = useState(countdown);
  const [loading, setLoading] = useState(false);

  // Таймер обратного отсчета
  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Авто-рефетч при 0
  useEffect(() => {
    if (seconds === 0 && !loading) {
      handleRefresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await queryClient.invalidateQueries({ queryKey });
      setSeconds(countdown); // сброс таймера после успешного запроса
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className="refresh-button"
      onClick={handleRefresh}
      style={{
        background: "none",
        border: "none",
        fontSize: 12,
        height: 28,
        position: "relative",
        cursor: "pointer",
      }}
    >
      <RefreshCcw
        size={28}
        style={{
          transition: "transform 0.3s linear",
          transform: loading ? "rotate(360deg)" : "rotate(0deg)",
          animation: loading ? "spin 1s ease infinite" : "none",
        }}
        color="var(--text-color)"
      />
      <span
        style={{
          position: "absolute",
          top: "0px",
          right: "0px",
          width: "100%",
          height: "100%",
          display: "flex",
          color: "var(--text-color)",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 600,
        }}
      >
        {seconds}
      </span>

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </button>
  );
};

export default RefreshButton;
