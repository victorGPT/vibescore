import React, { useEffect, useState } from "react";
import { MatrixRain } from "../ui/matrix-a/components/MatrixRain.jsx";
import { SignalBox } from "../ui/matrix-a/components/SignalBox.jsx";
import { DecodingText } from "../ui/matrix-a/components/DecodingText.jsx";

export function AuthCallbackPage() {
  const [status, setStatus] = useState("ESTABLISHING_UPLINK");

  useEffect(() => {
    const steps = [
      "HANDSHAKE_INITIATED...",
      "VERIFYING_CREDENTIALS...",
      "DECRYPTING_IDENTITY...",
      "ACCESS_GRANTED",
    ];
    let i = 0;
    const interval = setInterval(() => {
      if (i < steps.length) {
        setStatus(steps[i]);
        i++;
      }
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] font-mono text-[#00FF41] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <MatrixRain />

      <div className="relative z-10 w-full max-w-md">
        <SignalBox title="SYSTEM_AUTH" className="animate-pulse">
          <div className="flex flex-col items-center space-y-4 py-8">
            <div className="w-16 h-16 border-4 border-[#00FF41] border-t-transparent rounded-full animate-spin"></div>

            <div className="text-xl font-black tracking-[0.2em] text-center">
              <DecodingText text={status} />
            </div>

            <div className="text-[10px] opacity-50 uppercase tracking-widest">
              Please wait while we secure your connection
            </div>
          </div>
        </SignalBox>
      </div>
    </div>
  );
}
