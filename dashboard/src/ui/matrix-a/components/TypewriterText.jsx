import React, { useEffect, useMemo, useState } from "react";

function usePrefersReducedMotion() {
  return useMemo(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);
}

export function TypewriterText({
  text,
  segments,
  className = "",
  startDelayMs = 0,
  speedMs = 22,
  cursor = true,
  cursorClassName = "",
  loop = false,
  loopDelayMs = 1200,
  active = true,
  respectReducedMotion = true,
  wrap = false,
}) {
  const reduceMotion = usePrefersReducedMotion();
  const fullText = useMemo(() => {
    if (Array.isArray(segments) && segments.length) {
      return segments.map((segment) => String(segment.text || "")).join("");
    }
    return text || "";
  }, [segments, text]);
  const [count, setCount] = useState(() => {
    if (!active || !fullText) return fullText.length;
    if (typeof window === "undefined") return fullText.length;
    return 0;
  });

  useEffect(() => {
    if (!active) {
      setCount(fullText.length);
      return undefined;
    }
    if ((respectReducedMotion && reduceMotion) || typeof window === "undefined") {
      setCount(fullText.length);
      return undefined;
    }
    if (!fullText) {
      setCount(0);
      return undefined;
    }

    let timeout = 0;
    let cancelled = false;
    const safeSpeed = Math.max(8, Number(speedMs) || 0);
    const safeDelay = Math.max(0, Number(startDelayMs) || 0);

    const step = (index) => {
      if (cancelled) return;
      setCount(index);
      if (index < fullText.length) {
        timeout = window.setTimeout(() => step(index + 1), safeSpeed);
      } else if (loop) {
        timeout = window.setTimeout(() => step(0), loopDelayMs);
      }
    };

    setCount(0);
    timeout = window.setTimeout(() => step(1), safeDelay);

    return () => {
      cancelled = true;
      if (timeout) window.clearTimeout(timeout);
    };
  }, [
    active,
    loop,
    loopDelayMs,
    reduceMotion,
    respectReducedMotion,
    speedMs,
    startDelayMs,
    fullText,
  ]);

  const showCursor = cursor && !(respectReducedMotion && reduceMotion);
  const visibleText = fullText.slice(0, count);

  const renderSegments = () => {
    let remaining = count;
    return segments.map((segment, index) => {
      const sliceCount = Math.max(0, remaining);
      const nextText = sliceCount
        ? String(segment.text || "").slice(0, sliceCount)
        : "";
      remaining -= String(segment.text || "").length;
      return (
        <span key={index} className={segment.className || ""}>
          {nextText}
        </span>
      );
    });
  };

  const containerClass = wrap ? "block" : "inline-flex items-baseline";
  const textClass = wrap ? "whitespace-pre-wrap break-words" : "whitespace-pre";

  return (
    <span className={`${containerClass} ${className}`}>
      {fullText ? <span className="sr-only">{fullText}</span> : null}
      <span aria-hidden="true" className={textClass}>
        {Array.isArray(segments) && segments.length ? renderSegments() : visibleText}
      </span>
      {showCursor ? (
        <span
          aria-hidden="true"
          className={`ml-1 inline-block leading-none animate-pulse ${cursorClassName}`}
        >
          |
        </span>
      ) : null}
    </span>
  );
}
