import React, { useEffect, useMemo, useState } from "react";

import { isScreenshotModeEnabled } from "../../../lib/screenshot-mode.js";
import { shouldScrambleText } from "../matrix-a/util/should-scramble.js";

const DEFAULT_CHARS = "01XYZA@#$%";

function usePrefersReducedMotion() {
  return useMemo(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);
}

function scrambleValue(text, chars) {
  const safeChars = chars && chars.length ? chars : DEFAULT_CHARS;
  return String(text)
    .split("")
    .map((char) => (char === " " ? " " : safeChars[Math.floor(Math.random() * safeChars.length)]))
    .join("");
}

export function ScrambleText({
  text,
  className = "",
  chars = DEFAULT_CHARS,
  durationMs = 900,
  fps = 30,
  loop = false,
  loopDelayMs = 2000,
  active = true,
  startScrambled = false,
  respectReducedMotion = true,
}) {
  const reduceMotion = usePrefersReducedMotion();
  const screenshotMode = useMemo(() => {
    if (typeof window === "undefined") return false;
    return isScreenshotModeEnabled(window.location.search);
  }, []);
  const shouldScramble = shouldScrambleText({
    scrambleRespectReducedMotion: respectReducedMotion,
    prefersReducedMotion: reduceMotion,
    screenshotMode,
  });
  const [display, setDisplay] = useState(() => {
    if (!active || !startScrambled || !text) return text || "";
    if (typeof window === "undefined") return text || "";
    if (!shouldScramble) return text || "";
    return scrambleValue(text, chars);
  });

  useEffect(() => {
    if (!active) {
      setDisplay(text || "");
      return undefined;
    }
    if (!shouldScramble || typeof window === "undefined") {
      setDisplay(text || "");
      return undefined;
    }
    if (!text) {
      setDisplay("");
      return undefined;
    }

    const safeChars = chars && chars.length ? chars : DEFAULT_CHARS;
    const frameInterval = fps > 0 ? 1000 / fps : 33;
    let raf = 0;
    let timeout = 0;
    let startTime = 0;
    let lastFrame = 0;
    let cancelled = false;

    if (startScrambled) {
      setDisplay(scrambleValue(text, safeChars));
    }

    const runFrame = (now) => {
      if (cancelled) return;
      if (!startTime) startTime = now;
      const elapsed = now - startTime;
      if (elapsed - lastFrame < frameInterval) {
        raf = window.requestAnimationFrame(runFrame);
        return;
      }
      lastFrame = elapsed;

      const progress = durationMs > 0 ? Math.min(elapsed / durationMs, 1) : 1;
      const revealCount = Math.floor(progress * text.length);

      const next = text
        .split("")
        .map((char, idx) => {
          if (idx < revealCount) return char;
          return safeChars[Math.floor(Math.random() * safeChars.length)];
        })
        .join("");

      setDisplay(next);

      if (progress < 1) {
        raf = window.requestAnimationFrame(runFrame);
      } else if (loop) {
        timeout = window.setTimeout(() => {
          startTime = 0;
          lastFrame = 0;
          raf = window.requestAnimationFrame(runFrame);
        }, loopDelayMs);
      } else {
        setDisplay(text);
      }
    };

    raf = window.requestAnimationFrame(runFrame);

    return () => {
      cancelled = true;
      if (raf) window.cancelAnimationFrame(raf);
      if (timeout) window.clearTimeout(timeout);
    };
  }, [
    active,
    chars,
    durationMs,
    fps,
    loop,
    loopDelayMs,
    shouldScramble,
    startScrambled,
    text,
  ]);

  return <span className={className}>{display}</span>;
}
