import React from "react";
import { AsciiBox } from "./AsciiBox.jsx";

/**
 * 费用分析弹窗 (渐进式披露设计)
 */
export function CostAnalysisModal({ isOpen, onClose, fleetData = [] }) {
  if (!isOpen) return null;
  const totalUsd = fleetData.reduce((acc, cli) => acc + (cli.usd || 0), 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
      <div className="w-full max-w-2xl transform animate-in fade-in zoom-in duration-200">
        <AsciiBox title="NEURAL_BILLING_MANIFEST">
          <div className="space-y-8 py-4">
            <div className="text-center pb-6 border-b border-[#00FF41]/20">
              <div className="text-[10px] opacity-40 uppercase tracking-[0.4em] mb-2 font-bold text-[#00FF41]">
                Estimated_Aggregate_Cost
              </div>
              <div
                className="text-5xl font-black text-[#FFD700] tracking-tighter"
                style={{ textShadow: "0 0 20px rgba(255, 215, 0, 0.4)" }}
              >
                ${totalUsd.toLocaleString()}
              </div>
            </div>

            <div className="space-y-6 max-h-[45vh] overflow-y-auto no-scrollbar pr-2">
              {fleetData.map((cli, idx) => (
                <div key={idx} className="space-y-3">
                  <div className="flex justify-between items-baseline border-b border-white/5 pb-1">
                    <span className="text-[11px] font-black text-white uppercase tracking-widest">
                      {cli.label}
                    </span>
                    <span className="text-[10px] font-bold text-[#FFD700]">
                      ${cli.usd}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-1.5">
                    {cli.models.map((m, midx) => (
                      <div
                        key={midx}
                        className="flex justify-between text-[9px] font-mono text-[#00FF41]/60"
                      >
                        <span>
                          {m.name} ({m.share}%)
                        </span>
                        <span className="opacity-40">
                          CALC: {m.calc || "DYNAMIC"}
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
              >
                [ ESC ] CLOSE_TERMINAL
              </button>
              <p className="text-[7px] opacity-20 uppercase font-mono text-[#00FF41]">
                Algorithm_Build: v9.4.2
              </p>
            </div>
          </div>
        </AsciiBox>
      </div>
    </div>
  );
}
