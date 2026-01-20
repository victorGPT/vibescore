import React from "react";
import { DecodingText } from "./DecodingText.jsx";
import { copy } from "../../../lib/copy";

/**
 * Landing Page 专用的 AsciiBox 变体
 * (原 Landing.jsx 中的 AsciiBox，为了不与 dashboard 的 AsciiBox 冲突，命名为 SignalBox)
 */
export const SignalBox = ({ title = copy("signalbox.title_default"), children, className = "" }) => (
  <div
    className={`relative flex flex-col matrix-panel ${className}`}
  >
    <div className="flex items-center text-matrix-primary leading-none text-heading p-2 border-b border-matrix-ghost">
      <span className="font-black uppercase bg-matrix-panelStrong px-2 py-1 border border-matrix-ghost mr-2">
        <DecodingText text={title} />
      </span>
      <span className="flex-1 text-matrix-ghost truncate">
        --------------------------------------------------
      </span>
    </div>
    <div className="p-4 relative z-10 h-full">{children}</div>
    <div className="absolute top-0 left-0 w-1.5 h-1.5 bg-matrix-primary opacity-60"></div>
    <div className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-matrix-primary opacity-60"></div>
  </div>
);
