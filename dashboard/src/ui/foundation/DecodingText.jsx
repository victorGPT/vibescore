import React, { useEffect, useMemo, useState } from "react";

import { isScreenshotModeEnabled } from "../../lib/screenshot-mode.js";

/**
 * 稳定版解码文字 (Ultra-Stable)
 */
function usePrefersReducedMotion() {
  return useMemo(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);
}

export const DecodingText = ({ text = "", className = "" }) => {
  const [display, setDisplay] = useState(() => String(text || ""));
  const reduceMotion = usePrefersReducedMotion();
  const screenshotMode = useMemo(() => {
    if (typeof window === "undefined") return false;
    return isScreenshotModeEnabled(window.location.search);
  }, []);
  const chars = "0101XYZA@#$%";

  useEffect(() => {
    const target = String(text || "");
    if (!target) return;

    setDisplay(target);
    if (reduceMotion || screenshotMode || typeof window === "undefined") return;
    let iterations = 0;
    const step = Math.max(1, Math.ceil(target.length / 12));
    const intervalMs = 24;
    const interval = setInterval(() => {
      setDisplay(() => {
        const baseText = String(target);
        return baseText
          .split("")
          .map((char, index) => {
            if (index < iterations) return baseText[index];
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join("");
      });

      if (iterations >= target.length) clearInterval(interval);
      iterations += step;
    }, intervalMs);

    return () => clearInterval(interval);
  }, [reduceMotion, text]);

  return <span className={className}>{display}</span>;
};
