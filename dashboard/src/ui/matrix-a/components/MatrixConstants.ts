export const COLORS = {
  MATRIX: "#00FF41",
  GOLD: "#FFD700",
  DARK: "#050505",
};

export const TEXTURES = [
  // 1. 实心块：降低不透明度，不抢眼
  { bg: `${COLORS.MATRIX}99`, pattern: "none" },
  // 2. 斜纹：极低透明度
  {
    bg: "transparent",
    pattern: `repeating-linear-gradient(45deg, transparent, transparent 2px, ${COLORS.MATRIX}33 2px, ${COLORS.MATRIX}33 4px)`,
  },
  // 3. 点阵：更稀疏
  {
    bg: "transparent",
    pattern: `radial-gradient(${COLORS.MATRIX}33 1px, transparent 1px)`,
    size: "4px 4px",
  },
  // 4. 竖条：极细微的分割感
  {
    bg: "transparent",
    pattern: `linear-gradient(90deg, ${COLORS.MATRIX}1A 1px, transparent 1px)`,
    size: "3px 100%",
  },
];
