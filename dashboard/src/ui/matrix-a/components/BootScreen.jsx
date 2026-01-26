import React from "react";

import { copy } from "../../../lib/copy";

export function BootScreen({ onSkip }) {
  const canSkip = Boolean(onSkip);

  return (
    <div
      className={`min-h-screen bg-matrix-dark text-matrix-primary font-matrix flex flex-col items-center justify-center p-8 text-center text-body ${
        canSkip ? "cursor-pointer" : ""
      }`}
      onClick={canSkip ? onSkip : undefined}
      role={canSkip ? "button" : undefined}
      tabIndex={canSkip ? 0 : undefined}
      onKeyDown={
        canSkip
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") onSkip?.();
            }
          : undefined
      }
      aria-label={canSkip ? copy("boot.skip_aria") : undefined}
    >
      <pre className="text-caption leading-[1.2] mb-6 text-matrix-muted select-none">
        {copy("boot.ascii_art")}
      </pre>
      <div className="animate-pulse tracking-[0.3em] text-caption font-bold mb-4 uppercase">
        {copy("boot.prompt")}
      </div>
      <div className="w-64 h-1 bg-matrix-panelStrong relative overflow-hidden">
        <div className="absolute inset-0 bg-matrix-primary animate-[loader_2s_linear_infinite]"></div>
      </div>
      {canSkip ? (
        <p className="mt-6 text-caption text-matrix-muted uppercase">
          {copy("boot.skip_hint")}
        </p>
      ) : null}
      <style>{`@keyframes loader { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }`}</style>
    </div>
  );
}
