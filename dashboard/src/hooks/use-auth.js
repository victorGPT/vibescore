import { useCallback, useEffect, useState } from "react";

import {
  clearAuthStorage,
  clearSessionExpired,
  loadAuthFromStorage,
  loadSessionExpired,
  saveAuthToStorage,
  subscribeAuthStorage,
} from "../lib/auth-storage.js";

export function useAuth() {
  const [auth, setAuth] = useState(() => loadAuthFromStorage());
  const [sessionExpired, setSessionExpired] = useState(() =>
    loadSessionExpired()
  );

  useEffect(() => {
    const unsubscribe = subscribeAuthStorage(
      ({ auth: nextAuth, sessionExpired: nextExpired }) => {
        setAuth(nextAuth);
        setSessionExpired(nextExpired);
      }
    );
    return unsubscribe;
  }, []);

  useEffect(() => {
    const path = window.location.pathname.replace(/\/+$/, "");
    const isCallbackPath = path === "/auth/callback" || path === "";
    if (!isCallbackPath) return;

    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("access_token") || "";
    if (!accessToken) return;

    clearSessionExpired();
    const next = {
      accessToken,
      userId: params.get("user_id") || null,
      email: params.get("email") || null,
      name: params.get("name") || null,
      savedAt: new Date().toISOString(),
    };

    saveAuthToStorage(next);
    setAuth(next);
    setSessionExpired(false);
    window.history.replaceState({}, "", "/");
  }, []);

  const signOut = useCallback(() => {
    clearAuthStorage();
    clearSessionExpired();
    setAuth(null);
    setSessionExpired(false);
  }, []);

  const signedIn = Boolean(auth?.accessToken) && !sessionExpired;
  const effectiveAuth = signedIn ? auth : null;

  return {
    auth: effectiveAuth,
    signedIn,
    sessionExpired,
    signOut,
  };
}
