import React, { useEffect, useState } from "react";

export function ConnectionStatus({
  status = "STABLE",
  title,
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
      color: "text-matrix-primary",
      indicator: bit,
    },
    UNSTABLE: {
      color: "text-yellow-400",
      indicator: "!",
    },
    LOST: {
      color: "text-red-500/90",
      indicator: "×",
    },
  };

  const current = configs[status] || configs.STABLE;

  return (
    <div
      title={title}
      className={[
        "matrix-header-chip font-matrix transition-all duration-700",
        current.color,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex items-center">
        <span className="text-caption text-matrix-dim mr-1">[</span>
        <span className="text-caption w-[10px] inline-block text-center font-black">
          {current.indicator}
        </span>
        <span className="text-caption text-matrix-dim ml-1">]</span>
      </div>
    </div>
  );
}
