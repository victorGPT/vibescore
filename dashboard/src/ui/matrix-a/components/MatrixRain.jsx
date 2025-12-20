import React, { useEffect, useRef } from "react";

export function MatrixRain() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const reduceMotion = Boolean(
      window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const characters = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const fontSize = 16;
    const trailAlpha = reduceMotion ? 0.2 : 0.1;
    const dropSpeed = reduceMotion ? 0.35 : 1;
    const resetThreshold = reduceMotion ? 0.995 : 0.985;
    const frameIntervalMs = reduceMotion ? 120 : 45;
    const glyphAlpha = reduceMotion ? 0.6 : 0.9;

    const glyphs = characters.split("");

    let width = 0;
    let height = 0;
    let drops = [];
    let raf = 0;
    let last = 0;

    function resize() {
      width = window.innerWidth || 0;
      height = window.innerHeight || 0;
      const dpr = window.devicePixelRatio || 1;

      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = `${fontSize}px "Share Tech Mono", monospace`;
      ctx.textBaseline = "top";

      const columns = Math.max(1, Math.floor(width / fontSize));
      const maxDrop = height / fontSize;
      drops = Array.from({ length: columns }, () =>
        Math.floor(Math.random() * maxDrop)
      );

      ctx.fillStyle = "rgba(0, 0, 0, 1)";
      ctx.fillRect(0, 0, width, height);
    }

    resize();
    window.addEventListener("resize", resize, { passive: true });

    function draw(ts) {
      const dt = ts - last;
      if (dt < frameIntervalMs) {
        raf = window.requestAnimationFrame(draw);
        return;
      }
      last = ts;

      ctx.fillStyle = `rgba(0, 0, 0, ${trailAlpha})`;
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = `rgba(0, 255, 65, ${glyphAlpha})`;

      for (let i = 0; i < drops.length; i++) {
        const x = i * fontSize;
        const y = drops[i] * fontSize;
        const char = glyphs[Math.floor(Math.random() * glyphs.length)];

        ctx.fillText(char, x, y);

        if (y > height && Math.random() > resetThreshold) {
          drops[i] = 0;
        } else {
          drops[i] += dropSpeed;
        }
      }

      raf = window.requestAnimationFrame(draw);
    }

    raf = window.requestAnimationFrame(draw);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className="fixed inset-0 w-screen h-screen pointer-events-none opacity-[0.14] z-0"
      aria-hidden="true"
    />
  );
}
