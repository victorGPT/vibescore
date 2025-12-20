import React, { useEffect, useState } from "react";

export function ConnectionStatus({
  status = "STABLE",
  title,
  onClick,
  className = "",
}) {
  const [bit, setBit] = useState("0");

  useEffect(() => {
    let interval;
    if (status === "STABLE") {
      interval = window.setInterval(() => {
        setBit(Math.random() > 0.5 ? "1" : "0");
      }, 150);
    }
    return () => window.clearInterval(interval);
  }, [status]);

  const configs = {
    STABLE: {
      text: "LINK: STABLE",
      color: "text-[#00FF41]",
      bg: "bg-[#00FF41]",
      glow: "shadow-[0_0_10px_#00FF41]",
      indicator: bit,
      anim: "animate-pulse",
    },
    UNSTABLE: {
      text: "LINK: WEAK",
      color: "text-yellow-400",
      bg: "bg-yellow-400",
      glow: "shadow-[0_0_10px_#FACC15]",
      indicator: "!",
      anim: "animate-pulse",
    },
    LOST: {
      text: "SIGNAL: LOST",
      color: "text-red-500/90",
      bg: "bg-red-900/60",
      glow: "shadow-[0_0_5px_rgba(255,0,0,0.2)]",
      indicator: "×",
      anim: "",
    },
  };

  const current = configs[status] || configs.STABLE;
  const Comp = onClick ? "button" : "div";

  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      title={title}
      className={[
        "flex items-center space-x-3 font-mono transition-all duration-700",
        "p-2 border border-white/5 bg-black/20",
        onClick
          ? "hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00FF41]/30"
          : null,
        current.color,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="text-[10px] font-black uppercase tracking-[0.2em]">
        {current.text}
      </span>
      <div className="flex items-center">
        <span className="text-[8px] opacity-30 mr-1">[</span>
        <span className="text-[9px] w-[8px] inline-block text-center font-black">
          {current.indicator}
        </span>
        <div
          className={[
            "w-1.5 h-1.5 rounded-full ml-1.5 transition-all duration-500",
            current.bg,
            current.glow,
            current.anim,
          ]
            .filter(Boolean)
            .join(" ")}
        ></div>
        <span className="text-[8px] opacity-30 ml-1">]</span>
      </div>
    </Comp>
  );
}
