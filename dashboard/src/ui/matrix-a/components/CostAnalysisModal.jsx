import React from "react";

import { copy } from "../../../lib/copy.js";
import { formatUsdCurrency, toFiniteNumber } from "../../../lib/format.js";
import { AsciiBox } from "./AsciiBox.jsx";

function formatUsdValue(value) {
  if (!Number.isFinite(value)) return copy("shared.placeholder.short");
  const formatted = formatUsdCurrency(value.toFixed(6));
  return formatted === "-" ? copy("shared.placeholder.short") : formatted;
}

export function CostAnalysisModal({ isOpen, onClose, fleetData = [] }) {
  if (!isOpen) return null;

  const percentSymbol = copy("shared.unit.percent");
  const calcPrefix = copy("dashboard.cost_breakdown.calc_prefix");
  const calcFallback = copy("dashboard.cost_breakdown.calc_dynamic");

  const normalizedFleet = (Array.isArray(fleetData) ? fleetData : []).map(
    (fleet) => {
      const usdValue = toFiniteNumber(fleet?.usd);
      const normalizedUsd = Number.isFinite(usdValue) ? usdValue : 0;
      const models = Array.isArray(fleet?.models) ? fleet.models : [];
      return {
        label: fleet?.label ? String(fleet.label) : "",
        usdValue: normalizedUsd,
        usdLabel: formatUsdValue(normalizedUsd),
        models: models.map((model) => {
          const shareValue = toFiniteNumber(model?.share);
          const shareLabel = Number.isFinite(shareValue)
            ? `${shareValue}${percentSymbol}`
            : copy("shared.placeholder.short");
          const calcRaw = typeof model?.calc === "string" ? model.calc.trim() : "";
          const calcValue = calcRaw ? calcRaw.toUpperCase() : calcFallback;
          return {
            name: model?.name ? String(model.name) : "",
            shareLabel,
            calcValue,
          };
        }),
      };
    }
  );

  const totalUsd = normalizedFleet.reduce((acc, fleet) => acc + fleet.usdValue, 0);
  const totalUsdLabel = formatUsdValue(totalUsd);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
      <div className="w-full max-w-2xl transform animate-in fade-in zoom-in duration-200">
        <AsciiBox title={copy("dashboard.cost_breakdown.title")}>
          <div className="space-y-8 py-4">
            <div className="text-center pb-6 border-b border-[#00FF41]/20">
              <div className="text-[10px] opacity-40 uppercase tracking-[0.4em] mb-2 font-bold text-[#00FF41]">
                {copy("dashboard.cost_breakdown.total_label")}
              </div>
              <div
                className="text-5xl font-black text-[#FFD700] tracking-tighter"
                style={{ textShadow: "0 0 20px rgba(255, 215, 0, 0.4)" }}
              >
                {totalUsdLabel}
              </div>
            </div>

            <div className="space-y-6 max-h-[45vh] overflow-y-auto no-scrollbar pr-2">
              {normalizedFleet.map((fleet, index) => (
                <div key={`${fleet.label}-${index}`} className="space-y-3">
                  <div className="flex justify-between items-baseline border-b border-white/5 pb-1">
                    <span className="text-[11px] font-black text-white uppercase tracking-widest">
                      {fleet.label}
                    </span>
                    <span className="text-[10px] font-bold text-[#FFD700]">
                      {fleet.usdLabel}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-1.5">
                    {fleet.models.map((model, modelIndex) => (
                      <div
                        key={`${model.name}-${modelIndex}`}
                        className="flex justify-between text-[9px] font-mono text-[#00FF41]/60"
                      >
                        <span>
                          {model.name} ({model.shareLabel})
                        </span>
                        <span className="opacity-40">
                          {calcPrefix} {model.calcValue}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-[#00FF41]/20 flex justify-between items-center">
              <button
                onClick={onClose}
                className="text-[10px] font-black uppercase text-[#00FF41] border border-[#00FF41]/40 px-6 py-2 hover:bg-[#00FF41] hover:text-black transition-all"
                type="button"
              >
                {copy("dashboard.cost_breakdown.close")}
              </button>
              <p className="text-[7px] opacity-20 uppercase font-mono text-[#00FF41]">
                {copy("dashboard.cost_breakdown.footer")}
              </p>
            </div>
          </div>
        </AsciiBox>
      </div>
    </div>
  );
}
