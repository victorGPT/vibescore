import React from "react";

import { copy } from "../../../lib/copy";

export function VersionBadge({ version }) {
  const value = typeof version === "string" ? version.trim() : "";
  if (!value) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 bg-matrix-panel border border-matrix-ghost px-3 py-2 shadow-[0_0_12px_rgba(0,255,65,0.08)]">
      <div className="text-caption text-matrix-muted uppercase font-bold">
        {copy("dashboard.version.label")}
      </div>
      <div className="text-body text-matrix-bright font-black tracking-tight">
        {value}
      </div>
    </div>
  );
}
