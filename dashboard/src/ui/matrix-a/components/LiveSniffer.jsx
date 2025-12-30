import React, { useState, useEffect } from "react";

import { copy } from "../../../lib/copy.js";

/**
 * 实时演示组件 - 日志流
 */
export const LiveSniffer = () => {
  const [logs, setLogs] = useState([
    copy("live_sniffer.log.system"),
    copy("live_sniffer.log.socket"),
  ]);

  useEffect(() => {
    const events = [
      copy("live_sniffer.event.intercepted"),
      copy("live_sniffer.event.quantifying"),
      copy("live_sniffer.event.analysis"),
      copy("live_sniffer.event.sync"),
      copy("live_sniffer.event.batch"),
      copy("live_sniffer.event.hooking"),
      copy("live_sniffer.event.capture"),
    ];
    let i = 0;
    const interval = setInterval(() => {
      setLogs((prev) => [...prev.slice(-4), events[i % events.length]]);
      i++;
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="font-matrix text-caption text-matrix-muted space-y-2 h-full flex flex-col justify-end">
      {logs.map((log, idx) => (
        <div
          key={idx}
          className="animate-pulse border-l-2 border-matrix-ghost pl-2 truncate"
        >
          {log}
        </div>
      ))}
    </div>
  );
};
