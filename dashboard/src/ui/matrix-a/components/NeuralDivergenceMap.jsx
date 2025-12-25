import React from "react";

import { copy } from "../../../lib/copy.js";
import { AsciiBox } from "./AsciiBox.jsx";
import { NeuralAdaptiveFleet } from "./NeuralAdaptiveFleet.jsx";

export function NeuralDivergenceMap({
  fleetData = [],
  className = "",
  title = copy("dashboard.model_breakdown.title"),
  footer = copy("dashboard.model_breakdown.footer"),
}) {
  return (
    <AsciiBox title={title} className={className}>
      <div className="space-y-6 py-1 overflow-y-auto no-scrollbar">
        {fleetData.map((fleet, index) => (
          <NeuralAdaptiveFleet
            key={`${fleet.label}-${index}`}
            label={fleet.label}
            totalPercent={fleet.totalPercent}
            models={fleet.models}
          />
        ))}
      </div>
      {footer ? (
        <div className="mt-auto pt-1 border-t border-white/5 opacity-10 text-[7px] uppercase tracking-[0.4em] text-center italic leading-none">
          {footer}
        </div>
      ) : null}
    </AsciiBox>
  );
}
