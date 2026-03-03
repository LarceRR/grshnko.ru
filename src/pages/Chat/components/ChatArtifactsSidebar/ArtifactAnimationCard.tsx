import React, { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Dropdown, Spin } from "antd";
import {
  Play,
  Pause,
  SkipForward,
  Send,
  ExternalLink,
  Square,
} from "lucide-react";
import {
  getAnimationDetail,
  sendAnimationToDevice,
} from "../../../../api/animations";
import { getDevices } from "../../../../api/devices";
import { useAnimationSimulator } from "../../../../components/AnimationSimulator/hooks/useAnimationSimulator";
import type { Device } from "../../../../types/device";
import "./ChatArtifactsSidebar.scss";

interface ArtifactAnimationCardProps {
  animationId: string;
  description?: string | null;
}

export const ArtifactAnimationCard: React.FC<ArtifactAnimationCardProps> = ({
  animationId,
  description,
}) => {
  const stripRef = useRef<HTMLCanvasElement>(null);
  const [sendOpen, setSendOpen] = useState(false);

  const { data: animation, isLoading } = useQuery({
    queryKey: ["animation-detail", animationId],
    queryFn: () => getAnimationDetail(animationId),
    enabled: !!animationId,
  });

  const { data: devices = [] } = useQuery<Device[]>({
    queryKey: ["devices"],
    queryFn: getDevices,
    retry: false,
  });

  const {
    animData,
    leds,
    playing,
    paused,
    loadAndPlay,
    togglePause,
    stepFrame,
    stopAnim,
  } = useAnimationSimulator({
    animationBody: animation?.body ?? null,
  });

  useEffect(() => {
    if (!animData || !stripRef.current) return;
    const canvas = stripRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const n = animData.ledCount;
    if (n === 0) return;
    const w = canvas.width;
    const h = canvas.height;
    const pw = w / n;
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < n; i++) {
      const led = leds[i];
      if (led) {
        ctx.fillStyle = `rgb(${led.r},${led.g},${led.b})`;
        ctx.fillRect(i * pw, 0, Math.ceil(pw), h);
      }
    }
  }, [animData, leds]);

  useEffect(() => {
    if (!stripRef.current || !animData) return;
    stripRef.current.width = stripRef.current.offsetWidth;
    stripRef.current.height = stripRef.current.offsetHeight;
  }, [animData]);

  const handleSendToDevice = async (deviceId: string) => {
    setSendOpen(false);
    try {
      await sendAnimationToDevice(animationId, { deviceId });
    } catch {
      // notify on error could be added
    }
  };

  const onlineDevices = devices.filter((d) => d.status === "online");
  const sendMenuItems = onlineDevices.map((d) => ({
    key: d.deviceId,
    label: d.name || d.deviceId || d.location,
    onClick: () => handleSendToDevice(d.deviceId),
  }));

  if (isLoading) {
    return (
      <div className="artifact-card artifact-card--animation">
        <div className="artifact-card__loading">
          <Spin size="small" />
        </div>
      </div>
    );
  }

  if (!animation?.body) {
    return (
      <div className="artifact-card artifact-card--animation">
        <span className="artifact-card__id">{animationId}</span>
        <p className="artifact-card__desc">{description || "—"}</p>
        <Link to={`/animation/${animationId}`} className="artifact-card__link">
          Открыть анимацию <ExternalLink size={12} />
        </Link>
      </div>
    );
  }

  return (
    <div className="artifact-card artifact-card--animation">
      <span className="artifact-card__id">{animationId.slice(0, 8)}…</span>
      {description && <p className="artifact-card__desc">{description}</p>}
      <div className="artifact-card__strip-wrap">
        <canvas
          ref={stripRef}
          className="artifact-card__strip"
          width={280}
          height={24}
          style={{ width: "100%", height: 24 }}
        />
      </div>
      <div className="artifact-card__controls">
        {!playing ? (
          <button
            type="button"
            className="artifact-card__btn"
            onClick={loadAndPlay}
            title="Запустить"
          >
            <Play size={14} />
          </button>
        ) : (
          <button
            type="button"
            className="artifact-card__btn"
            onClick={togglePause}
            title={paused ? "Продолжить" : "Пауза"}
          >
            <Pause size={14} />
          </button>
        )}
        <button
          type="button"
          className="artifact-card__btn"
          onClick={stepFrame}
          title="Шаг"
        >
          <SkipForward size={14} />
        </button>
        <button
          type="button"
          className="artifact-card__btn"
          onClick={stopAnim}
          disabled={!playing}
          title="Стоп"
        >
          <Square size={12} fill="currentColor" />
        </button>
        <Dropdown
          menu={{ items: sendMenuItems }}
          open={sendOpen}
          onOpenChange={setSendOpen}
          trigger={["click"]}
          disabled={onlineDevices.length === 0}
        >
          <button
            type="button"
            className="artifact-card__btn"
            title="Отправить на устройство"
          >
            <Send size={14} />
          </button>
        </Dropdown>
      </div>
      <Link to={`/animation/${animationId}`} className="artifact-card__link">
        Открыть анимацию <ExternalLink size={12} />
      </Link>
    </div>
  );
};
