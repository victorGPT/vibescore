import React from "react";

export function DataRow({ label, value, subValue, valueClassName = "" }) {
  return (
    <div className="flex justify-between items-center border-b border-matrix-ghost py-2 group hover:bg-matrix-panel transition-colors px-2">
      <span className="text-caption text-matrix-muted uppercase font-bold leading-none">
        {label}
      </span>
      <div className="flex items-center space-x-3">
        {subValue ? (
          <span className="text-caption text-matrix-dim italic">{subValue}</span>
        ) : null}
        <span className={`font-black tracking-tight text-body ${valueClassName}`}>
          {value}
        </span>
      </div>
    </div>
  );
}
