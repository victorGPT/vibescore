import React, { useState } from "react";
import { AsciiBox } from "./AsciiBox.jsx";
import { MatrixButton } from "./MatrixButton.jsx";
import { copy } from "../../../lib/copy.js"; // 假设有copy文件，或者这里直接写死文本

export function UpgradeAlertModal({
  currentVersion = "0.0.7",
  requiredVersion = "0.0.9",
  installCommand = "npx --yes @vibescore/tracker init",
  onClose,
}) {
  const [copied, setCopied] = useState(false);

  if (!onClose) {
    // If no onClose handler is provided, we assume it's still blocking or controlled externally,
    // but for this specific request we are making it dismissible.
    // Ideally the parent component controls visibility.
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(installCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-lg transform animate-in fade-in zoom-in duration-300">
        {/* 使用金色/通知色调的 AsciiBox */}
        <div className="relative border border-[#FFD700]/30 shadow-[0_0_30px_rgba(255,215,0,0.15)] bg-black/90">
          <AsciiBox
            title="SYSTEM_UPDATE_NOTICE"
            className="border-none bg-transparent"
          >
            <div className="space-y-6 py-2 px-2">
              {/* Header Icon / Warning */}
              <div className="flex items-center space-x-4 border-b border-[#FFD700]/20 pb-4">
                <div className="text-4xl">✨</div>
                <div>
                  <h3 className="text-[#FFD700] font-bold tracking-widest text-lg uppercase">
                    New_Protocol_Available
                  </h3>
                  <p className="text-[10px] text-[#FFD700]/60 font-mono uppercase tracking-wider">
                    Recommended update for optimal performance
                  </p>
                </div>
              </div>

              {/* Version Diff */}
              <div className="grid grid-cols-2 gap-4 text-center font-mono">
                <div className="bg-white/5 p-2 border border-white/10 opacity-50">
                  <div className="text-[8px] uppercase text-gray-400">
                    Current_Client
                  </div>
                  <div className="text-xl font-bold text-gray-500 decoration-2">
                    v{currentVersion}
                  </div>
                </div>
                <div className="bg-[#FFD700]/10 p-2 border border-[#FFD700]/40 shadow-[0_0_10px_rgba(255,215,0,0.2)]">
                  <div className="text-[8px] uppercase text-[#FFD700]">
                    Target_Client
                  </div>
                  <div className="text-xl font-bold text-[#FFD700]">
                    v{requiredVersion}
                  </div>
                </div>
              </div>

              {/* Command Area */}
              <div className="space-y-2">
                <p className="text-[9px] text-gray-400 uppercase tracking-widest">
                  Upgrade_Sequence:
                </p>
                <div className="group relative">
                  <div className="font-mono text-sm bg-black border border-white/20 p-4 text-gray-300 flex items-center justify-between">
                    <span className="mr-4">$ {installCommand}</span>
                  </div>
                  <div className="absolute top-0 right-0 bottom-0">
                    <button
                      onClick={handleCopy}
                      className="h-full px-4 bg-white/5 hover:bg-white/20 border-l border-white/20 text-[10px] font-black uppercase tracking-wider transition-all text-gray-400 hover:text-white"
                    >
                      {copied ? "[ COPIED ]" : "[ COPY ]"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex justify-center pt-2 border-t border-white/10 mt-4">
                <button
                  onClick={onClose}
                  className="text-[10px] font-black uppercase text-[#FFD700]/60 hover:text-[#FFD700] border border-transparent hover:border-[#FFD700]/30 px-8 py-2 transition-all tracking-widest"
                >
                  [ DISMISS_NOTICE ]
                </button>
              </div>
            </div>
          </AsciiBox>
        </div>
      </div>
    </div>
  );
}
