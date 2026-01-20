import React from "react";

import { copy } from "../../../lib/copy";

export function SystemHeader({
  title = copy("system.header.title_default"),
  signalLabel,
  time,
  className = "",
}) {
  return (
    <header
      className={`flex justify-between border-b border-matrix-ghost p-4 items-center shrink-0 bg-matrix-panel ${className}`}
    >
      <div className="flex items-center space-x-4">
        <div className="bg-matrix-primary text-black px-2 py-1 font-black text-heading uppercase skew-x-[-10deg] border border-matrix-primary shadow-[0_0_10px_#00FF41]">
          {title}
        </div>
        {signalLabel ? (
          <span className="text-caption text-matrix-muted hidden sm:inline font-bold uppercase animate-pulse">
            {signalLabel}
          </span>
        ) : null}
      </div>
      {time ? (
        <div className="text-matrix-primary font-bold text-body tracking-widest">
          {time}
        </div>
      ) : null}
    </header>
  );
}
