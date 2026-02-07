import React from "react";
import { Input } from "@base-ui/react/input";

export function MatrixInput({ label, className = "", ...props }) {
  return (
    <label className={`flex flex-col gap-2 ${className}`}>
      <span className="text-caption text-matrix-muted uppercase font-bold">
        {label}
      </span>
      <Input
        className="h-10 bg-matrix-panel border border-matrix-ghost px-3 text-body text-matrix-bright outline-none focus:border-matrix-primary focus:ring-2 focus:ring-matrix-primary/20"
        {...props}
      />
    </label>
  );
}
