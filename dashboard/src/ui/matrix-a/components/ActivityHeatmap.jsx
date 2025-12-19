import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { buildActivityHeatmap } from "../../../lib/activity-heatmap.js";

const OPACITY_BY_LEVEL = [0.12, 0.32, 0.5, 0.7, 1];
const CELL_SIZE = 12;
const CELL_GAP = 3;
const LABEL_WIDTH = 26;
const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function formatTokenValue(value) {
  if (typeof value === "bigint") return value.toLocaleString();
  if (typeof value === "number") {
    return Number.isFinite(value) ? Math.round(value).toLocaleString() : "0";
  }
  if (typeof value === "string") {
    const s = value.trim();
    if (/^[0-9]+$/.test(s)) {
      try {
        return BigInt(s).toLocaleString();
      } catch (_e) {}
    }
    const n = Number(s);
    return Number.isFinite(n) ? Math.round(n).toLocaleString() : s;
  }
  return "0";
}

function parseMonth(day) {
  if (typeof day !== "string") return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day.trim());
  if (!m) return null;
  const month = Number(m[2]);
  if (!Number.isFinite(month)) return null;
  return month - 1;
}

function buildMonthMarkers(weeks) {
  const markers = [];
  let lastMonth = null;
  for (let i = 0; i < weeks.length; i += 1) {
    const week = weeks[i];
    const first = (Array.isArray(week) ? week : []).find((cell) => cell?.day);
    if (!first?.day) continue;
    const monthIdx = parseMonth(first.day);
    if (monthIdx == null) continue;
    if (monthIdx !== lastMonth) {
      markers.push({ label: MONTH_LABELS[monthIdx], index: i });
      lastMonth = monthIdx;
    }
  }
  return markers;
}

export function ActivityHeatmap({ heatmap }) {
  const weekStartsOn = heatmap?.week_starts_on === "mon" ? "mon" : "sun";
  const normalizedHeatmap = useMemo(() => {
    const sourceWeeks = Array.isArray(heatmap?.weeks) ? heatmap.weeks : [];
    if (!sourceWeeks.length) return { weeks: [] };
    const rows = [];
    for (const week of sourceWeeks) {
      for (const cell of Array.isArray(week) ? week : []) {
        if (!cell?.day) continue;
        rows.push({ day: cell.day, total_tokens: cell.value ?? 0 });
      }
    }
    const desiredWeeks = Math.max(52, sourceWeeks.length);
    const rebuilt = buildActivityHeatmap({
      dailyRows: rows,
      weeks: desiredWeeks,
      to: heatmap?.to,
      weekStartsOn,
    });
    return rebuilt;
  }, [heatmap?.to, heatmap?.weeks, weekStartsOn]);

  const weeks = normalizedHeatmap?.weeks || [];
  const dayLabels =
    weekStartsOn === "mon"
      ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const monthMarkers = useMemo(() => buildMonthMarkers(weeks), [weeks]);
  const scrollRef = useRef(null);
  const [scrollState, setScrollState] = useState({ left: 0, width: 1, overflow: false });

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
    const overflow = maxScroll > 1;
    const width = el.scrollWidth > 0 ? el.clientWidth / el.scrollWidth : 1;
    const left = maxScroll > 0 ? el.scrollLeft / maxScroll : 0;
    setScrollState({ left, width: Math.min(1, Math.max(0, width)), overflow });
  }, []);

  if (!weeks.length) {
    return (
      <div className="text-[10px] opacity-40 font-mono">
        No activity data yet.
      </div>
    );
  }

  const gridColumns = {
    display: "grid",
    gridTemplateColumns: `${LABEL_WIDTH}px repeat(${weeks.length}, ${CELL_SIZE}px)`,
    columnGap: `${CELL_GAP}px`,
  };

  const labelRows = {
    display: "grid",
    gridTemplateRows: `repeat(7, ${CELL_SIZE}px)`,
    rowGap: `${CELL_GAP}px`,
  };

  const gridRows = {
    display: "grid",
    gridAutoFlow: "column",
    gridTemplateRows: `repeat(7, ${CELL_SIZE}px)`,
    gap: `${CELL_GAP}px`,
  };

  useEffect(() => {
    updateScrollState();
  }, [updateScrollState, weeks.length]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;
    let raf = 0;
    const onScroll = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(updateScrollState);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [updateScrollState]);

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 w-6 pointer-events-none heatmap-scroll-hint-left"></div>
        <div className="absolute inset-y-0 right-0 w-10 pointer-events-none heatmap-scroll-hint-right"></div>
        <div ref={scrollRef} className="overflow-x-scroll matrix-scrollbar">
          <div className="inline-flex flex-col min-w-max">
            <div
              style={gridColumns}
              className="text-[8px] uppercase opacity-40 tracking-widest mb-2"
            >
              <span></span>
              {monthMarkers.map((label) => (
                <span
                  key={`${label.label}-${label.index}`}
                  style={{ gridColumnStart: label.index + 2 }}
                  className="whitespace-nowrap"
                >
                  {label.label}
                </span>
              ))}
            </div>

            <div style={gridColumns}>
              <div
                style={labelRows}
                className="text-[8px] uppercase opacity-40 tracking-widest"
              >
                {dayLabels.map((label) => (
                  <span key={label} className="leading-none">
                    {label}
                  </span>
                ))}
              </div>

              <div style={gridRows}>
                {weeks.map((week, wIdx) =>
                  (Array.isArray(week) ? week : []).map((cell, dIdx) => {
                    const key = cell?.day || `empty-${wIdx}-${dIdx}`;
                    if (!cell) {
                      return (
                        <span
                          key={key}
                          className="rounded-[2px] border border-transparent"
                          style={{ width: CELL_SIZE, height: CELL_SIZE }}
                        ></span>
                      );
                    }

                    const level = Number(cell.level) || 0;
                    const opacity = OPACITY_BY_LEVEL[level] ?? 0.3;
                    const color =
                      level === 0
                        ? "rgba(0,255,65,0.08)"
                        : `rgba(0,255,65,${opacity})`;

                    return (
                      <span
                        key={key}
                        title={`${cell.day} • ${formatTokenValue(cell.value)} tokens`}
                        className="rounded-[2px] border border-[#00FF41]/10"
                        style={{
                          width: CELL_SIZE,
                          height: CELL_SIZE,
                          background: color,
                        }}
                      ></span>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="heatmap-scrollbar-track" style={{ opacity: scrollState.overflow ? 0.7 : 0.3 }}>
        <div
          className="heatmap-scrollbar-thumb"
          style={{
            width: `${Math.max(12, scrollState.width * 100)}%`,
            transform: `translateX(${scrollState.left * (100 - scrollState.width * 100)}%)`,
          }}
        ></div>
      </div>

      <div className="flex justify-between items-center text-[7px] border-t border-[#00FF41]/5 pt-2 opacity-40 font-black uppercase tracking-widest">
        <div className="flex items-center gap-2">
          <span>Less</span>
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((level) => (
              <span
                key={level}
                className="rounded-[2px] border border-[#00FF41]/10"
                style={{
                  width: 10,
                  height: 10,
                  background:
                    level === 0
                      ? "rgba(0,255,65,0.08)"
                      : `rgba(0,255,65,${OPACITY_BY_LEVEL[level]})`,
                }}
              ></span>
            ))}
          </div>
          <span>More</span>
        </div>
        <span>UTC</span>
      </div>
    </div>
  );
}
