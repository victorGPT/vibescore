import React from "react";

import { copy } from "../../../lib/copy.js";
import { TEXTURES } from "./MatrixConstants.js";

export function NeuralAdaptiveFleet({ label, totalPercent, models = [] }) {
  const percentSymbol = copy("shared.unit.percent");

  return (
    <div className="w-full space-y-4">
      <div className="flex justify-between items-baseline border-b border-[#00FF41]/10 pb-1.5">
        <span className="text-[12px] font-black text-white uppercase tracking-[0.2em]">
          {label}
        </span>
        <div className="flex items-baseline space-x-1">
          <span className="text-[11px] font-black text-[#00FF41] font-mono">
            {totalPercent}
          </span>
          <span className="text-[7px] text-[#00FF41]/40 font-bold">
            {percentSymbol}
          </span>
        </div>
      </div>

      <div className="h-2.5 w-full bg-white/5 flex overflow-hidden border border-white/10 p-[1px] relative shadow-inner">
        {models.map((model, index) => {
          const styleConfig = TEXTURES[index % TEXTURES.length];
          return (
            <div
              key={`${model.name}-${index}`}
              className="h-full relative transition-all duration-1000 ease-out border-r border-black last:border-none"
              style={{
                width: `${model.share}%`,
                backgroundColor: styleConfig.bg,
                backgroundImage: styleConfig.pattern,
                backgroundSize: styleConfig.size || "auto",
                boxShadow: index === 0 ? "0 0 10px rgba(0,255,65,0.2)" : "none",
              }}
            />
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-y-2 gap-x-6 pl-1">
        {models.map((model, index) => {
          const styleConfig = TEXTURES[index % TEXTURES.length];
          return (
            <div key={`${model.name}-${index}`} className="flex items-center space-x-2">
              <div
                className="w-2 h-2 border border-[#00FF41]/20 shrink-0"
                style={{
                  backgroundColor: styleConfig.bg,
                  backgroundImage: styleConfig.pattern,
                  backgroundSize: styleConfig.size || "auto",
                }}
              />
              <div className="flex items-baseline space-x-2 min-w-0">
                <span className="text-[9px] font-mono truncate uppercase text-[#00FF41] font-bold">
                  {model.name}
                </span>
                <span className="text-[8px] font-mono text-[#00FF41]/60 font-bold">
                  {model.share}
                  {percentSymbol}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
