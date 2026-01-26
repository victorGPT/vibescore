export function resolveAuthGate({
  publicMode,
  mockEnabled,
  sessionSoftExpired,
  signedIn,
  authPending,
}) {
  if (authPending) return "loading";
  if (!publicMode && !signedIn && !mockEnabled && !sessionSoftExpired) {
    return "landing";
  }
  return "dashboard";
}
