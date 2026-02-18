import { useRef, useEffect } from "react";
import { useAnimationSimulator } from "./hooks/useAnimationSimulator";
import { disassemble } from "./engine";
import type { AnimationDetail } from "../../types/animation";
import "./AnimationSimulator.scss";

interface AnimationSimulatorProps {
  animation: AnimationDetail | null;
}

export default function AnimationSimulator({
  animation,
}: AnimationSimulatorProps) {
  const stripCanvasRef = useRef<HTMLCanvasElement>(null);
  const largeCanvasRef = useRef<HTMLCanvasElement>(null);
  const histCanvasRef = useRef<HTMLCanvasElement>(null);

  const {
    animData,
    leds,
    playing,
    paused,
    currentT,
    selectedPixel,
    setSelectedPixel,
    pixelHistory,
    fps,
    loadAndPlay,
    togglePause,
    stepFrame,
    stopAnim,
    updateParam,
  } = useAnimationSimulator({
    animationBody: animation?.body || null,
  });

  // Resize canvases
  useEffect(() => {
    const resizeCanvases = () => {
      if (stripCanvasRef.current) {
        stripCanvasRef.current.width = stripCanvasRef.current.clientWidth;
        stripCanvasRef.current.height = stripCanvasRef.current.clientHeight;
      }
      if (largeCanvasRef.current) {
        largeCanvasRef.current.width = largeCanvasRef.current.clientWidth;
        largeCanvasRef.current.height = largeCanvasRef.current.clientHeight;
      }
      if (histCanvasRef.current) {
        histCanvasRef.current.width = histCanvasRef.current.clientWidth;
        histCanvasRef.current.height = histCanvasRef.current.clientHeight;
      }
    };

    resizeCanvases();
    window.addEventListener("resize", resizeCanvases);
    return () => window.removeEventListener("resize", resizeCanvases);
  }, []);

  // Draw strip
  useEffect(() => {
    if (!animData || !stripCanvasRef.current || !largeCanvasRef.current) return;

    const stripCanvas = stripCanvasRef.current;
    const stripCtx = stripCanvas.getContext("2d");
    const largeCanvas = largeCanvasRef.current;
    const largeCtx = largeCanvas.getContext("2d");

    if (!stripCtx || !largeCtx) return;

    const n = animData.ledCount;
    if (n === 0) return;

    // Small strip
    const sw = stripCanvas.width;
    const sh = stripCanvas.height;
    const pw = sw / n;
    stripCtx.clearRect(0, 0, sw, sh);
    for (let i = 0; i < n; i++) {
      const led = leds[i];
      stripCtx.fillStyle = `rgb(${led.r},${led.g},${led.b})`;
      stripCtx.fillRect(i * pw, 0, Math.ceil(pw), sh);
    }
    if (selectedPixel >= 0 && selectedPixel < n) {
      stripCtx.strokeStyle = "#fff";
      stripCtx.lineWidth = 2;
      stripCtx.strokeRect(selectedPixel * pw, 0, Math.ceil(pw), sh);
    }

    // Large strip (wrapping into rows)
    const lw = largeCanvas.width;
    const lh = largeCanvas.height;
    const cols = Math.ceil(Math.sqrt((n * lw) / lh));
    const rows = Math.ceil(n / cols);
    const cellW = lw / cols;
    const cellH = lh / rows;
    largeCtx.clearRect(0, 0, lw, lh);
    for (let i = 0; i < n; i++) {
      const led = leds[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      largeCtx.fillStyle = `rgb(${led.r},${led.g},${led.b})`;
      largeCtx.fillRect(
        col * cellW,
        row * cellH,
        Math.ceil(cellW),
        Math.ceil(cellH),
      );
    }
  }, [animData, leds, selectedPixel]);

  // Draw history
  useEffect(() => {
    if (!histCanvasRef.current || pixelHistory.length < 2) return;

    const histCanvas = histCanvasRef.current;
    const histCtx = histCanvas.getContext("2d");
    if (!histCtx) return;

    const w = histCanvas.width;
    const h = histCanvas.height;
    histCtx.clearRect(0, 0, w, h);

    const n = pixelHistory.length;
    const dx = w / (n - 1);

    for (const [ch, color] of [
      ["r", "#f85149"],
      ["g", "#3fb950"],
      ["b", "#58a6ff"],
    ] as const) {
      histCtx.strokeStyle = color;
      histCtx.lineWidth = 1.5;
      histCtx.beginPath();
      for (let i = 0; i < n; i++) {
        const y = h - (pixelHistory[i][ch] / 255) * h;
        if (i === 0) histCtx.moveTo(0, y);
        else histCtx.lineTo(i * dx, y);
      }
      histCtx.stroke();
    }
  }, [pixelHistory]);

  const handleStripClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!animData || !stripCanvasRef.current) return;
    const rect = stripCanvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pixel = Math.floor(
      (x / stripCanvasRef.current.width) * animData.ledCount,
    );
    setSelectedPixel(pixel);
  };

  if (!animation || !animation.body) {
    return (
      <div className="animation-simulator">
        <div className="simulator-placeholder">
          Загрузите анимацию для симуляции
        </div>
      </div>
    );
  }

  const selectedLed =
    selectedPixel >= 0 && selectedPixel < leds.length
      ? leds[selectedPixel]
      : null;
  const hex = selectedLed
    ? `#${selectedLed.r.toString(16).padStart(2, "0")}${selectedLed.g
        .toString(16)
        .padStart(2, "0")}${selectedLed.b.toString(16).padStart(2, "0")}`
    : "";

  const disasmOutput = animData
    ? disassemble(animData.bytecodeArr, animData.bytecodeArr.length)
    : "Load an animation to see bytecode.";

  return (
    <div className="animation-simulator">
      <div className="simulator-header">
        <h2>🔆 Симулятор анимации</h2>
        <div className="simulator-controls">
          <button
            className="btn-primary"
            onClick={loadAndPlay}
            disabled={!animData}
          >
            ▶ Запустить
          </button>
          <button
            onClick={togglePause}
            disabled={!playing}
            className="btn-secondary"
          >
            {paused ? "▶ Продолжить" : "⏸ Пауза"}
          </button>
          <button
            onClick={stepFrame}
            disabled={!animData}
            className="btn-secondary"
          >
            → Шаг
          </button>
          <button onClick={stopAnim} disabled={!playing} className="btn-danger">
            ■ Стоп
          </button>
        </div>
      </div>

      <div className="simulator-main">
        <div className="simulator-left-panel">
          <div className="strip-container">
            <div className="strip-label">
              LED Strip ({animData?.ledCount || 0} пикселей) — кликните на LED
              для деталей
            </div>
            <canvas
              ref={stripCanvasRef}
              id="ledCanvas"
              height={40}
              onClick={handleStripClick}
              className="led-canvas"
            />
            <canvas
              ref={largeCanvasRef}
              id="ledCanvasLarge"
              height={120}
              className="led-canvas-large"
            />
          </div>
          <div className="info-bar">
            <span>
              <span
                className={`status-dot ${
                  !playing ? "off" : paused ? "paused" : "on"
                }`}
              />
              <span id="statusText">
                {!playing
                  ? "Остановлено"
                  : paused
                    ? "Пауза"
                    : "Воспроизведение"}
              </span>
            </span>
            <span>
              t = <b>{currentT}</b> ms
            </span>
            <span>
              FPS: <b>{fps}</b>
            </span>
            <span>
              LEDs: <b>{animData?.ledCount || 0}</b>
            </span>
            <span>
              Params: <b>{animData?.numParams || 0}</b>
            </span>
            <span>
              Bytecode: <b>{animData?.bytecodeArr.length || 0}</b> bytes
            </span>
          </div>
        </div>

        <div className="simulator-right-panel">
          <div className="panel-section">
            <h3>🎯 Инспектор пикселя (кликните на LED для выбора)</h3>
            <div className="pixel-info">
              {selectedLed ? (
                <>
                  <b>Пиксель {selectedPixel}</b>
                  <br />
                  <span
                    className="rgb-preview"
                    style={{ background: hex }}
                  />{" "}
                  R: <b>{selectedLed.r}</b> G: <b>{selectedLed.g}</b> B:{" "}
                  <b>{selectedLed.b}</b>
                  <br />
                  Hex: <b>{hex}</b>
                  <br />
                  Время: <b>{currentT}</b> ms
                </>
              ) : (
                "Пиксель не выбран. Кликните на полосу."
              )}
            </div>
          </div>
          <div className="panel-section">
            <h3>📊 История RGB (выбранный пиксель)</h3>
            <canvas ref={histCanvasRef} id="historyCanvas" height={100} />
          </div>
          <div className="panel-section">
            <h3>🔧 Дизассемблер байткода</h3>
            <div className="disasm-output">{disasmOutput}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
