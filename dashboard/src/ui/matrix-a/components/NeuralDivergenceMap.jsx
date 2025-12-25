import React from "react";
import { AsciiBox } from "./AsciiBox.jsx";
import { NeuralAdaptiveFleet } from "./NeuralAdaptiveFleet.jsx";

/**
 * 多引擎分析地图组件
 */
export function NeuralDivergenceMap({ fleetData = [], className = "" }) {
  return (
    <AsciiBox title="NEURAL_DIVERGENCE_MAP" className={className}>
      <div className="space-y-12 py-2 overflow-y-auto no-scrollbar">
        {fleetData.map((cli, idx) => (
          <NeuralAdaptiveFleet
            key={idx}
            label={cli.label}
            totalPercent={cli.total}
            models={cli.models}
          />
        ))}
      </div>
      <div className="mt-auto pt-6 border-t border-white/5 opacity-10 text-[7px] uppercase tracking-[0.4em] text-center italic">
        Multi-Engine Load Balancing // Active_Session
      </div>
    </AsciiBox>
  );
}
