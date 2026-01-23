export function shouldScrambleText({
  scrambleRespectReducedMotion,
  prefersReducedMotion,
  screenshotMode,
}) {
  if (screenshotMode) return false;
  if (scrambleRespectReducedMotion && prefersReducedMotion) return false;
  return true;
}
