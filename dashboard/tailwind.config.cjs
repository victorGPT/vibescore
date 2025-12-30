/** @type {import("tailwindcss").Config} */
const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        matrix: [
          '"Geist Mono"',
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          '"Liberation Mono"',
          '"Courier New"',
          "monospace",
        ],
        mono: ['"Geist Mono"', ...defaultTheme.fontFamily.mono],
      },
      fontSize: {
        display: [
          "clamp(48px, 6vw, 72px)",
          {
            lineHeight: "1",
            letterSpacing: "-0.02em",
            fontWeight: "900",
          },
        ],
        heading: [
          "14px",
          {
            lineHeight: "1.25",
            letterSpacing: "0.08em",
            fontWeight: "700",
          },
        ],
        body: [
          "16px",
          {
            lineHeight: "1.5",
            fontWeight: "500",
          },
        ],
        caption: [
          "12px",
          {
            lineHeight: "1.3",
            letterSpacing: "0.12em",
            fontWeight: "500",
          },
        ],
      },
      colors: {
        matrix: {
          primary: "#00FF41",
          bright: "#E8FFE9",
          muted: "rgba(0, 255, 65, 0.6)",
          dim: "rgba(0, 255, 65, 0.35)",
          ghost: "rgba(0, 255, 65, 0.18)",
          panel: "rgba(0, 10, 0, 0.7)",
          panelStrong: "rgba(0, 10, 0, 0.82)",
          dark: "#050505",
        },
        gold: "#FFD700",
      },
      boxShadow: {
        "matrix-glow": "0 0 24px rgba(0, 255, 65, 0.35)",
        "matrix-gold": "0 0 18px rgba(255, 215, 0, 0.35)",
      },
      backdropBlur: {
        panel: "10px",
      },
    },
  },
  plugins: [],
};
