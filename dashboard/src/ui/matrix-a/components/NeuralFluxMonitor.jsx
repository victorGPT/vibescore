import React, { useMemo } from "react";

import { AsciiBox } from "./AsciiBox.jsx";
import { toDisplayNumber } from "../../../lib/format.js";

const CHART_WIDTH = 320;
const CHART_HEIGHT = 120;
const CHART_PADDING = { top: 8, right: 8, bottom: 22, left: 36 };

function computeNiceMax(value) {
  if (!Number.isFinite(value) || value <= 0) return 0;
  const exp = Math.pow(10, Math.floor(Math.log10(value)));
  const n = Math.ceil(value / exp);
  const nice = n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return nice * exp;
}

function SeismographLine({ data, from, to }) {
  const pointsData = useMemo(() => {
    const values = Array.isArray(data)
      ? data.map((val) => Number(val) || 0)
      : [];
    const max = Math.max(...values, 0);
    const niceMax = computeNiceMax(max);
    const chartWidth =
      CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
    const chartHeight =
      CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;
    const points = values
      .map((val, i) => {
        const x =
          CHART_PADDING.left +
          (values.length <= 1 ? 0.5 : i / (values.length - 1)) * chartWidth;
        const y =
          CHART_PADDING.top +
          (niceMax > 0
            ? (1 - val / niceMax) * chartHeight
            : chartHeight);
        return `${x},${y}`;
      })
      .join(" ");
    const baseY = CHART_PADDING.top + chartHeight;
    const fillPath = points
      ? `${points} ${
          CHART_PADDING.left + chartWidth
        },${baseY} ${CHART_PADDING.left},${baseY}`
      : "";

    return { max, niceMax, points, fillPath, values };
  }, [data]);

  const hasData = pointsData.values.length > 0;
  const axisBottom = CHART_HEIGHT - CHART_PADDING.bottom;
  const axisRight = CHART_WIDTH - CHART_PADDING.right;
  const tickMax = pointsData.niceMax;
  const tickMid = tickMax > 0 ? tickMax / 2 : 0;
  const ticks = tickMax > 0 ? [tickMax, tickMid, 0] : [0];

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#00FF41]/5 border border-[#00FF41]/10">
      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 px-2 py-2">
        <div className="border-t border-dashed border-[#00FF41]"></div>
        <div className="border-t border-dashed border-[#00FF41]"></div>
        <div className="border-t border-dashed border-[#00FF41]"></div>
      </div>
      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        className="w-full h-full"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="flux-glow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00FF41" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#00FF41" stopOpacity="0" />
          </linearGradient>
          <filter id="flux-neon">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <line
          x1={CHART_PADDING.left}
          y1={CHART_PADDING.top}
          x2={CHART_PADDING.left}
          y2={axisBottom}
          stroke="rgba(0,255,65,0.35)"
          strokeWidth="1"
        />
        <line
          x1={CHART_PADDING.left}
          y1={axisBottom}
          x2={axisRight}
          y2={axisBottom}
          stroke="rgba(0,255,65,0.35)"
          strokeWidth="1"
        />
        {ticks.map((tick, idx) => {
          const y =
            tickMax > 0
              ? CHART_PADDING.top +
                (1 - tick / tickMax) *
                  (CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom)
              : axisBottom;
          return (
            <g key={`${tick}-${idx}`}>
              <line
                x1={CHART_PADDING.left - 4}
                y1={y}
                x2={CHART_PADDING.left}
                y2={y}
                stroke="rgba(0,255,65,0.35)"
                strokeWidth="1"
              />
              <text
                x={CHART_PADDING.left - 6}
                y={y + 3}
                fontSize="8"
                fill="rgba(0,255,65,0.5)"
                textAnchor="end"
              >
                {toDisplayNumber(Math.round(tick))}
              </text>
            </g>
          );
        })}
        {from ? (
          <text
            x={CHART_PADDING.left}
            y={CHART_HEIGHT - 6}
            fontSize="8"
            fill="rgba(0,255,65,0.5)"
            textAnchor="start"
          >
            {from}
          </text>
        ) : null}
        {to ? (
          <text
            x={axisRight}
            y={CHART_HEIGHT - 6}
            fontSize="8"
            fill="rgba(0,255,65,0.5)"
            textAnchor="end"
          >
            {to}
          </text>
        ) : null}
        {pointsData.fillPath ? (
          <path d={`M${pointsData.fillPath} Z`} fill="url(#flux-glow)" />
        ) : null}
        {pointsData.points ? (
          <polyline
            points={pointsData.points}
            fill="none"
            stroke="#00FF41"
            strokeWidth="2"
            filter="url(#flux-neon)"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
      </svg>
      {!hasData ? (
        <div className="absolute inset-0 flex items-center justify-center text-[10px] opacity-40">
          No signal data.
        </div>
      ) : null}
      <div className="absolute top-2 right-2 text-[9px] font-bold text-[#00FF41] bg-black/80 px-2 border border-[#00FF41]">
        PEAK: {hasData ? toDisplayNumber(Math.round(pointsData.max)) : "—"}
      </div>
    </div>
  );
}

export function NeuralFluxMonitor({ data, from, to, period, className = "" }) {
  const subtitle = period ? period.toUpperCase() : "—";
  return (
    <AsciiBox title="Trend" subtitle={subtitle} className={className}>
      <div className="h-48">
        <SeismographLine data={data} from={from} to={to} />
      </div>
    </AsciiBox>
  );
}
