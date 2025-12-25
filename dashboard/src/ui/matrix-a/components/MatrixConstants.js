export const COLORS = {
  MATRIX: "#00FF41",
  GOLD: "#FFD700",
  DARK: "#050505",
};

export const TEXTURES = [
  { bg: COLORS.MATRIX, pattern: "none" },
  {
    bg: "transparent",
    pattern: `repeating-linear-gradient(45deg, transparent, transparent 2px, ${COLORS.MATRIX}44 2px, ${COLORS.MATRIX}44 4px)`,
  },
  {
    bg: "transparent",
    pattern: `radial-gradient(${COLORS.MATRIX}44 1px, transparent 1px)`,
    size: "4px 4px",
  },
  {
    bg: "transparent",
    pattern: `linear-gradient(90deg, ${COLORS.MATRIX}22 1px, transparent 1px)`,
    size: "3px 100%",
  },
];
