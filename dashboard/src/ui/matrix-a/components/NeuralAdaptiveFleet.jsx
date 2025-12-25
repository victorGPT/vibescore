import React from "react";
import { TEXTURES } from "./MatrixConstants";

/**
 * 复合能量条组件 (统一亮度 + 物理间隙)
 */
export function NeuralAdaptiveFleet({ label, totalPercent, models = [] }) {
  return (
    <div className="w-full space-y-4">
      {/* CLI 锚点层 */}
      <div className="flex justify-between items-baseline border-b border-[#00FF41]/10 pb-1.5">
        <span className="text-[12px] font-black text-white uppercase tracking-[0.2em]">
          {label}
        </span>
        <div className="flex items-baseline space-x-1">
          <span className="text-[11px] font-black text-[#00FF41] font-mono">
            {totalPercent}
          </span>
          <span className="text-[7px] text-[#00FF41]/40 font-bold">%</span>
        </div>
      </div>

      {/* 能量条层 (物理间隙分割) */}
      <div className="h-2.5 w-full bg-white/5 flex overflow-hidden border border-white/10 p-[1px] relative shadow-inner">
        {models.map((m, i) => {
          const styleConfig = TEXTURES[i % TEXTURES.length];
          return (
            <div
              key={i}
              className="h-full relative transition-all duration-1000 ease-out border-r border-black last:border-none"
              style={{
                width: m.share + "%",
                backgroundColor: styleConfig.bg,
                backgroundImage: styleConfig.pattern,
                backgroundSize: styleConfig.size || "auto",
                boxShadow: i === 0 ? "0 0 10px rgba(0,255,65,0.2)" : "none",
              }}
            />
          );
        })}
      </div>

      {/* 统一亮度的图例网格 */}
      <div className="grid grid-cols-2 gap-y-2 gap-x-6 pl-1">
        {models.map((m, i) => {
          const styleConfig = TEXTURES[i % TEXTURES.length];
          return (
            <div key={i} className="flex items-center space-x-2">
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
                  {m.name}
                </span>
                <span className="text-[8px] font-mono text-[#00FF41]/60 font-bold">
                  {m.share}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
