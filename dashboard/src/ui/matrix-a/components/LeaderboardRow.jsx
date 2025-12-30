import React from "react";

import { copy } from "../../../lib/copy.js";
import { MatrixAvatar } from "./MatrixAvatar.jsx";

function formatRank(rank) {
  const raw = Number(rank);
  if (!Number.isFinite(raw)) return copy("shared.placeholder.short");
  return String(Math.max(0, raw)).padStart(2, "0");
}

function formatValue(value) {
  if (typeof value === "number") return value.toLocaleString();
  if (typeof value === "bigint") return value.toLocaleString();
  if (value == null) return copy("shared.placeholder.short");
  return String(value);
}

export function LeaderboardRow({
  rank,
  name,
  value,
  isAnon = false,
  isSelf = false,
  isTheOne,
  className = "",
}) {
  const highlight = isSelf
    ? "bg-matrix-panelStrong border-l-2 border-l-matrix-primary"
    : "";
  const rankValue = Number(rank);
  const showGold = Boolean(isTheOne ?? rankValue === 1);

  return (
    <div
      className={`flex justify-between items-center py-3 px-2 border-b border-matrix-ghost hover:bg-matrix-panel group ${highlight} ${className}`}
    >
      <div className="flex items-center space-x-3">
        <span
          className={`text-caption w-6 ${
            rankValue <= 3 ? "text-matrix-primary font-bold" : "text-matrix-muted"
          }`}
        >
          {formatRank(rank)}
        </span>
        <MatrixAvatar name={name} isAnon={isAnon} isTheOne={showGold} size={24} />
        <span
          className={`text-body uppercase font-bold tracking-tight ${
            isAnon ? "text-matrix-dim blur-[1px]" : "text-matrix-bright"
          }`}
        >
          {name}
        </span>
      </div>
      <span className="text-body font-bold text-matrix-primary">
        {formatValue(value)}
      </span>
    </div>
  );
}
