export function shouldDeferMount({ prefersReducedMotion, screenshotMode }) {
  if (screenshotMode) return false;
  if (prefersReducedMotion) return false;
  return true;
}
