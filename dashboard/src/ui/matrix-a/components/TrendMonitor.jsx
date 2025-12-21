import React, { useMemo, useRef, useState } from "react";

// --- Trend Monitor (NeuralFluxMonitor v2.0) ---
// Industrial TUI style: independent axes, precise grid, physical partitions.
export function TrendMonitor({
  rows,
  data = [],
  color = "#00FF41",
  label = "TREND",
  from,
  to,
  period,
}) {
  const series = Array.isArray(rows) && rows.length ? rows : null;
  const fallbackValues =
    data.length > 0 ? data : Array.from({ length: 24 }, () => 0);

  function toUtcDateOnly(d) {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  }

  function formatDateUTCValue(d) {
    return toUtcDateOnly(d).toISOString().slice(0, 10);
  }

  function addUtcDays(date, days) {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days));
  }

  function diffUtcDays(start, end) {
    return Math.floor((end.getTime() - start.getTime()) / 86400000);
  }

  function startOfUtcMonth(date) {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  }

  function addUtcMonths(date, months) {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
  }

  function diffUtcMonths(start, end) {
    return (
      (end.getUTCFullYear() - start.getUTCFullYear()) * 12 +
      (end.getUTCMonth() - start.getUTCMonth())
    );
  }

  function formatMonthKey(date) {
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
  }

  const timeline = useMemo(() => {
    if (!series || series.length === 0) {
      return {
        values: fallbackValues,
        labels: fallbackValues.map((_, idx) => String(idx)),
        bucketCount: fallbackValues.length,
        lastIndex: fallbackValues.length - 1,
      };
    }

    const now = new Date();
    const today = toUtcDateOnly(now);

    if (period === "day") {
      const hourMap = new Map();
      let dayDate = null;

      for (const row of series) {
        const hourLabel = row?.hour;
        if (hourLabel) {
          const dt = new Date(hourLabel);
          if (Number.isFinite(dt.getTime())) {
            if (!dayDate) dayDate = toUtcDateOnly(dt);
            const hour = dt.getUTCHours();
            const current = hourMap.get(hour) || 0;
            hourMap.set(hour, current + Number(row?.total_tokens || row?.value || 0));
          }
        }
      }

      if (!dayDate) {
        const parsed = parseDate(from) || parseDate(to);
        dayDate = parsed || today;
      }

      const values = [];
      const labels = [];
      for (let hour = 0; hour < 24; hour += 1) {
        const dt = new Date(
          Date.UTC(dayDate.getUTCFullYear(), dayDate.getUTCMonth(), dayDate.getUTCDate(), hour, 0, 0)
        );
        labels.push(dt.toISOString());
        values.push(hourMap.get(hour) || 0);
      }

      let lastIndex = 23;
      if (dayDate.getTime() > today.getTime()) lastIndex = -1;
      else if (dayDate.getTime() === today.getTime()) lastIndex = now.getUTCHours();

      return { values, labels, bucketCount: 24, lastIndex };
    }

    if (period === "total") {
      const monthMap = new Map();
      for (const row of series) {
        const key = row?.month;
        if (!key || typeof key !== "string") continue;
        const current = monthMap.get(key) || 0;
        monthMap.set(key, current + Number(row?.total_tokens || row?.value || 0));
      }

      const start = parseDate(from) || today;
      const end = parseDate(to) || today;
      const startMonth = startOfUtcMonth(start);
      const endMonth = startOfUtcMonth(end);
      const totalMonths = Math.max(1, diffUtcMonths(startMonth, endMonth) + 1);

      const values = [];
      const labels = [];
      for (let i = 0; i < totalMonths; i += 1) {
        const dt = addUtcMonths(startMonth, i);
        const key = formatMonthKey(dt);
        labels.push(key);
        values.push(monthMap.get(key) || 0);
      }

      return { values, labels, bucketCount: totalMonths, lastIndex: totalMonths - 1 };
    }

    const dayMap = new Map();
    for (const row of series) {
      const key = row?.day;
      if (!key || typeof key !== "string") continue;
      const current = dayMap.get(key) || 0;
      dayMap.set(key, current + Number(row?.total_tokens || row?.value || 0));
    }

    const start = parseDate(from) || today;
    const end = parseDate(to) || start;
    const totalDays = Math.max(1, diffUtcDays(start, end) + 1);

    const values = [];
    const labels = [];
    for (let i = 0; i < totalDays; i += 1) {
      const dt = addUtcDays(start, i);
      const key = formatDateUTCValue(dt);
      labels.push(key);
      values.push(dayMap.get(key) || 0);
    }

    let lastIndex = totalDays - 1;
    if (today.getTime() < start.getTime()) lastIndex = -1;
    else if (today.getTime() <= end.getTime()) {
      lastIndex = Math.min(totalDays - 1, diffUtcDays(start, today));
    }

    return { values, labels, bucketCount: totalDays, lastIndex };
  }, [fallbackValues, from, period, series, to]);

  const bucketCount = timeline.bucketCount;
  const lastIndex = timeline.lastIndex;
  const renderCount = lastIndex >= 0 ? Math.min(lastIndex + 1, timeline.values.length) : 0;
  const renderValues = renderCount > 0 ? timeline.values.slice(0, renderCount) : [];
  const analysisValues = renderValues.length > 0 ? renderValues : timeline.values;
  const max = Math.max(...analysisValues, 100);
  const avg =
    renderValues.length > 0
      ? renderValues.reduce((a, b) => a + b, 0) / renderValues.length
      : 0;

  const width = 100;
  const height = 100;
  const axisWidth = 8;
  const plotWidth = width - axisWidth;
  const plotTop = 4;
  const plotBottom = 4;
  const plotHeight = height - plotTop - plotBottom;

  function parseDate(value) {
    if (!value) return null;
    const parts = String(value).trim().split("-");
    if (parts.length !== 3) return null;
    const y = Number(parts[0]);
    const m = Number(parts[1]) - 1;
    const d = Number(parts[2]);
    if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
      return null;
    }
    return new Date(Date.UTC(y, m, d));
  }

  function formatAxisDate(dt) {
    if (!dt) return "";
    const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(dt.getUTCDate()).padStart(2, "0");
    return `${mm}-${dd}`;
  }

  const MONTH_LABELS = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];

  function formatMonth(dt) {
    if (!dt) return "";
    const yy = String(dt.getUTCFullYear()).slice(-2);
    return `${MONTH_LABELS[dt.getUTCMonth()]} ${yy}`;
  }

  function parseMonth(value) {
    if (!value) return null;
    const raw = String(value).trim();
    const parts = raw.split("-");
    if (parts.length !== 2) return null;
    const y = Number(parts[0]);
    const m = Number(parts[1]) - 1;
    if (!Number.isFinite(y) || !Number.isFinite(m)) return null;
    return new Date(Date.UTC(y, m, 1));
  }

  function pickLabelIndices(length) {
    if (length <= 1) return [0];
    const last = length - 1;
    const steps = [0, 0.25, 0.5, 0.75, 1];
    return steps.map((ratio) => Math.round(last * ratio));
  }

  function formatAxisLabel(raw) {
    if (!raw) return "";
    if (period === "total") {
      return formatMonth(parseMonth(raw));
    }
    return formatAxisDate(parseDate(raw));
  }

  function buildXAxisLabels() {
    if (period === "day") {
      return ["00:00", "06:00", "12:00", "18:00", "23:00"];
    }
    if (timeline.labels.length > 0) {
      const indices = pickLabelIndices(timeline.labels.length);
      const labels = indices.map((idx) => formatAxisLabel(timeline.labels[idx] || ""));
      if (labels.some((label) => label)) return labels;
    }
    const start = parseDate(from);
    const end = parseDate(to);
    if (!start || !end || end < start) {
      return ["-24H", "-18H", "-12H", "-6H", "NOW"];
    }
    const totalMs = end.getTime() - start.getTime();
    const steps = [0, 0.25, 0.5, 0.75, 1];
    if (period === "total") {
      return steps.map((ratio) =>
        formatMonth(new Date(start.getTime() + totalMs * ratio))
      );
    }
    return steps.map((ratio) =>
      formatAxisDate(new Date(start.getTime() + totalMs * ratio))
    );
  }

  function formatCompact(value) {
    const n = Number(value) || 0;
    const abs = Math.abs(n);
    if (abs >= 1e9) {
      const fixed = abs >= 1e10 ? 0 : 1;
      return `${(n / 1e9).toFixed(fixed)}B`;
    }
    if (abs >= 1e6) {
      const fixed = abs >= 1e7 ? 0 : 1;
      return `${(n / 1e6).toFixed(fixed)}M`;
    }
    if (abs >= 1e3) {
      const fixed = abs >= 1e4 ? 0 : 1;
      return `${(n / 1e3).toFixed(fixed)}K`;
    }
    return String(Math.round(n));
  }

  function formatFull(value) {
    const n = Number(value) || 0;
    return n.toLocaleString();
  }

  function formatTooltipLabel(label) {
    if (!label) return "UTC";
    const isoHour = /^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}Z$/;
    const isoDay = /^\\d{4}-\\d{2}-\\d{2}$/;
    const isoMonth = /^\\d{4}-\\d{2}$/;

    if (isoHour.test(label)) {
      const [date, time] = label.split("T");
      const hh = time.slice(0, 2);
      return `${date} ${hh}:00 UTC`;
    }
    if (isoDay.test(label)) return `${label} UTC`;
    if (isoMonth.test(label)) return `${label} UTC`;
    return label;
  }

  const points = useMemo(() => {
    if (renderValues.length === 0) return "";
    const denom = Math.max(bucketCount - 1, 1);
    return renderValues
      .map((val, i) => {
        const x = (i / denom) * plotWidth;
        const normalizedVal = max > 0 ? val / max : 0;
        const y = plotTop + (1 - normalizedVal) * plotHeight;
        return `${x},${y}`;
      })
      .join(" ");
  }, [bucketCount, max, plotHeight, plotTop, plotWidth, renderValues]);

  const lastX =
    renderValues.length > 0
      ? ((renderValues.length - 1) / Math.max(bucketCount - 1, 1)) * plotWidth
      : 0;
  const fillPath =
    renderValues.length > 0
      ? `${points} ${lastX},${height - plotBottom} 0,${height - plotBottom}`
      : `0,${height - plotBottom} 0,${height - plotBottom}`;
  const xLabels = useMemo(() => buildXAxisLabels(), [from, period, to, timeline.labels]);

  const plotRef = useRef(null);
  const [hover, setHover] = useState(null);

  function handleMove(e) {
    const el = plotRef.current;
    if (!el || bucketCount === 0 || lastIndex < 0) return;
    const rect = el.getBoundingClientRect();
    const axisWidthPx = (axisWidth / width) * rect.width;
    const plotWidthPx = rect.width - axisWidthPx;
    const rawX = Math.min(Math.max(e.clientX - rect.left, 0), plotWidthPx);
    const denom = Math.max(bucketCount - 1, 1);
    const ratio = plotWidthPx > 0 ? rawX / plotWidthPx : 0;
    const index = Math.round(ratio * denom);
    if (index > lastIndex) {
      setHover(null);
      return;
    }
    const value = timeline.values[index] ?? 0;
    const snappedX =
      denom > 0 ? (index / denom) * plotWidthPx : plotWidthPx / 2;
    const labelText = timeline.labels[index] || "";
    const yRatio = max > 0 ? 1 - value / max : 1;
    const yPx =
      (plotTop / height) * rect.height +
      yRatio * (plotHeight / height) * rect.height;
    setHover({
      index,
      value,
      label: labelText,
      x: snappedX,
      y: yPx,
      rectWidth: rect.width,
      axisWidthPx,
      plotWidthPx,
    });
  }

  function handleLeave() {
    setHover(null);
  }

  return (
    <div className="w-full h-full min-h-[160px] flex flex-col relative group select-none bg-[#050505] border border-white/10 p-1">
      <div className="flex justify-between items-center px-1 mb-1 border-b border-white/5 pb-1">
        <span className="shrink-0 font-black uppercase tracking-[0.2em] text-[#00FF41] px-2 py-0.5 bg-[#00FF41]/10 text-[9px] border border-[#00FF41]/20">
          {label}
        </span>
        <div className="flex gap-3 text-[8px] font-mono text-[#00FF41]/50">
          <span>MAX: {Math.round(max)}</span>
          <span>AVG: {Math.round(avg)}</span>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden border border-white/5 bg-black/40">
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, ${color} 1px, transparent 1px),
              linear-gradient(to bottom, ${color} 1px, transparent 1px)
            `,
            backgroundSize: "20px 20px",
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00FF41]/10 to-transparent w-[50%] h-full animate-[scan-x_3s_linear_infinite] pointer-events-none mix-blend-screen" />

        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full preserve-3d absolute inset-0 z-10"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.5" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>

          <path
            d={`M${fillPath} Z`}
            fill={`url(#grad-${label})`}
          />
          <polyline
            points={points}
            fill="none"
            stroke={color}
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
            className="drop-shadow-[0_0_5px_rgba(0,255,65,0.8)]"
          />
        </svg>

        <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-between py-1 px-1 text-[7px] font-mono text-[#00FF41]/60 pointer-events-none bg-black/60 backdrop-blur-[1px] border-l border-white/5 w-8 text-right">
          <span>{formatCompact(max)}</span>
          <span>{formatCompact(max * 0.75)}</span>
          <span>{formatCompact(max * 0.5)}</span>
          <span>{formatCompact(max * 0.25)}</span>
          <span>0</span>
        </div>

        <div
          ref={plotRef}
          className="absolute inset-0 z-20"
          onMouseMove={handleMove}
          onMouseLeave={handleLeave}
        ></div>

        {hover ? (
          <>
            <div
              className="absolute inset-y-0 left-0 pointer-events-none z-25"
              style={{ right: hover.axisWidthPx }}
            >
              <div
                className="absolute top-0 bottom-0 w-px bg-[#00FF41]/40 shadow-[0_0_6px_rgba(0,255,65,0.35)]"
                style={{ left: hover.x }}
              ></div>
              <div
                className="absolute w-2 h-2 rounded-full bg-[#00FF41] shadow-[0_0_6px_rgba(0,255,65,0.8)]"
                style={{ left: hover.x - 4, top: hover.y - 4 }}
              ></div>
            </div>
            <div
              className="absolute z-30 px-2 py-1 text-[9px] font-mono bg-black/90 border border-[#00FF41]/30 text-[#00FF41] pointer-events-none"
              style={{
                left: Math.min(
                  hover.x + 10,
                  hover.rectWidth - hover.axisWidthPx - 120
                ),
                top: Math.max(hover.y - 24, 6),
              }}
            >
              <div className="opacity-70">
                {formatTooltipLabel(hover.label)}
              </div>
              <div className="font-bold">{formatFull(hover.value)} tokens</div>
            </div>
          </>
        ) : null}
      </div>

      <div className="h-4 flex justify-between items-center px-1 mt-1 text-[8px] font-mono text-[#00FF41]/40 border-t border-white/5 pt-1">
        {xLabels.map((labelText, idx) => (
          <span
            key={`${labelText}-${idx}`}
            className={
              labelText === "NOW" ? "text-[#00FF41] font-bold animate-pulse" : ""
            }
          >
            {labelText}
          </span>
        ))}
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes scan-x {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `,
        }}
      />
    </div>
  );
}
