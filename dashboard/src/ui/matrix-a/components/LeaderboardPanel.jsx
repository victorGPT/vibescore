import React from "react";
import { Button } from "@base-ui/react/button";

import { copy } from "../../../lib/copy";
import { AsciiBox } from "../../foundation/AsciiBox.jsx";
import { LeaderboardRow } from "./LeaderboardRow.jsx";

const DEFAULT_PERIODS = [
  { key: "24H", label: copy("leaderboard.period.cycle_24h") },
  { key: "ALL", label: copy("leaderboard.period.legacy_all") },
];

export function LeaderboardPanel({
  title = copy("leaderboard.panel.title"),
  period = "ALL",
  periods = DEFAULT_PERIODS,
  onPeriodChange,
  rows = [],
  summary,
  summaryPeriod = "ALL",
  loadMoreLabel = copy("leaderboard.load_more"),
  emptyLabel = copy("leaderboard.empty"),
  onLoadMore,
  className = "",
}) {
  const showSummary = summary && period === summaryPeriod;
  const stats = Array.isArray(summary?.stats) ? summary.stats : [];

  return (
    <AsciiBox title={title} className={className}>
        <div className="flex border-b border-matrix-ghost mb-3 pb-2 gap-4 px-2">
          {periods.map((p) => (
            <Button
              key={p.key}
              type="button"
              className={`text-caption uppercase font-bold ${
                period === p.key
                  ? "text-matrix-bright border-b-2 border-matrix-primary"
                  : "text-matrix-muted"
              }`}
              onClick={() => onPeriodChange?.(p.key)}
            >
              {p.label}
            </Button>
          ))}
        </div>

      {showSummary ? (
        <div className="flex-1 flex flex-col items-center justify-center space-y-6 opacity-90 py-4">
          <div className="text-center">
            <div className="text-caption uppercase text-matrix-muted mb-2">
              {summary?.totalLabel}
            </div>
            <div className="text-body font-black text-matrix-bright">
              {summary?.totalValue}
            </div>
            {summary?.sinceLabel ? (
              <div className="text-caption text-matrix-muted mt-2">
                {summary.sinceLabel}
              </div>
            ) : null}
          </div>
          {stats.length ? (
            <div
              className={`grid gap-4 w-full px-8 ${
                stats.length > 1 ? "grid-cols-2" : "grid-cols-1"
              }`}
            >
              {stats.map((stat, idx) => (
                <div
                  key={`${stat.label || "stat"}-${idx}`}
                  className="border border-matrix-ghost bg-matrix-panel p-3 text-center"
                >
                  <div className="text-caption text-matrix-muted uppercase">
                    {stat.label}
                  </div>
                  <div className="text-body font-bold text-matrix-bright">
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto no-scrollbar py-2 px-1">
          {rows.length ? (
            rows.map((row) => (
              <LeaderboardRow
                key={`${row.rank}-${row.name}`}
                rank={row.rank}
                name={row.name}
                value={row.value}
                isAnon={row.isAnon}
                isSelf={row.isSelf}
                isTheOne={row.isTheOne}
              />
            ))
          ) : (
            <div className="text-center text-caption text-matrix-muted py-2">
              {emptyLabel}
            </div>
          )}
          {rows.length && loadMoreLabel ? (
            <Button
              type="button"
              onClick={onLoadMore}
              className="w-full text-center text-caption text-matrix-muted py-2 hover:text-matrix-primary"
            >
              {loadMoreLabel}
            </Button>
          ) : null}
        </div>
      )}
    </AsciiBox>
  );
}
