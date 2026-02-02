import React from "react";

import { MatrixShell } from "../../foundation/MatrixShell.jsx";
import { LeaderboardPanel } from "../components/LeaderboardPanel.jsx";

export function LeaderboardView({
  copy,
  period,
  periods,
  rows,
  loading,
  error,
  onPeriodChange,
  onLoadMore,
  showLoadMore,
}) {
  const emptyLabel = loading
    ? copy("leaderboard.loading")
    : copy("leaderboard.empty");

  return (
    <MatrixShell>
      <div className="max-w-4xl mx-auto flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <div className="text-heading text-matrix-primary font-black uppercase">
            {copy("leaderboard.page.title")}
          </div>
          <div className="text-caption text-matrix-muted uppercase">
            {copy("leaderboard.page.subtitle")}
          </div>
        </div>

        {error ? (
          <div className="text-caption text-matrix-muted">
            {copy("shared.error.prefix", { error })}
          </div>
        ) : null}

        <LeaderboardPanel
          period={period}
          periods={periods}
          rows={rows}
          emptyLabel={emptyLabel}
          onPeriodChange={onPeriodChange}
          onLoadMore={showLoadMore ? onLoadMore : null}
          loadMoreLabel={showLoadMore ? copy("leaderboard.load_more") : null}
        />
      </div>
    </MatrixShell>
  );
}
