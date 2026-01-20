import React from "react";

import { MatrixAvatar } from "../ui/matrix-a/components/MatrixAvatar.jsx";
import { LiveSniffer } from "../ui/matrix-a/components/LiveSniffer.jsx";
import { SignalBox } from "../ui/matrix-a/components/SignalBox.jsx";
import { copy } from "../lib/copy";

export function LandingExtras({
  handle,
  onHandleChange,
  specialHandle,
  handlePlaceholder,
  rankLabel,
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
      <SignalBox title={copy("landing.signal.identity_probe")} className="h-44">
        <div className="flex items-center space-x-6 h-full">
          <MatrixAvatar
            name={handle}
            size={80}
            isTheOne={handle === specialHandle}
          />
          <div className="flex-1 text-left space-y-3">
            <div className="flex flex-col">
              <label className="text-caption text-matrix-muted uppercase mb-2 font-bold">
                {copy("landing.handle.label")}
              </label>
              <input
                type="text"
                value={handle}
                onChange={onHandleChange}
                className="w-full bg-transparent border-b border-matrix-dim text-matrix-bright font-black text-2xl md:text-3xl p-1 focus:outline-none focus:border-matrix-primary transition-colors"
                maxLength={10}
                placeholder={handlePlaceholder}
              />
            </div>
            <div className="text-caption text-matrix-muted">{rankLabel}</div>
          </div>
        </div>
      </SignalBox>

      <SignalBox title={copy("landing.signal.live_sniffer")} className="h-44">
        <LiveSniffer />
      </SignalBox>
    </div>
  );
}
