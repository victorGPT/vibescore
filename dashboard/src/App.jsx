import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useAuth as useInsforgeAuth } from "@insforge/react-router";

import { getInsforgeBaseUrl } from "./lib/config.js";
import { ErrorBoundary } from "./components/ErrorBoundary.jsx";
import { LandingPage } from "./pages/LandingPage.jsx";
import { isMockEnabled } from "./lib/mock-data.js";
import { fetchLatestTrackerVersion } from "./lib/npm-version.js";
import {
  clearAuthStorage,
  clearSessionExpired,
  loadSessionExpired,
  subscribeSessionExpired,
} from "./lib/auth-storage.js";
import {
  buildRedirectUrl,
  resolveRedirectTarget,
  storeRedirectFromSearch,
  stripRedirectParam,
} from "./lib/auth-redirect.js";
import { insforgeAuthClient } from "./lib/insforge-auth-client.js";
import { probeBackend } from "./lib/vibeusage-api.js";

import { UpgradeAlertModal } from "./ui/matrix-a/components/UpgradeAlertModal.jsx";

const DashboardPage = React.lazy(() =>
  import("./pages/DashboardPage.jsx").then((mod) => ({
    default: mod.DashboardPage,
  }))
);

export default function App() {
  const baseUrl = useMemo(() => getInsforgeBaseUrl(), []);
  const {
    isLoaded: insforgeLoaded,
    isSignedIn: insforgeSignedIn,
    signOut: insforgeSignOut,
  } = useInsforgeAuth();
  const mockEnabled = isMockEnabled();
  const [latestVersion, setLatestVersion] = useState(null);
  const [insforgeSession, setInsforgeSession] = useState(null);
  const [sessionExpired, setSessionExpired] = useState(() => loadSessionExpired());
  const lastProbeTokenRef = useRef(null);

  useEffect(() => {
    let active = true;
    fetchLatestTrackerVersion({ allowStale: true }).then((version) => {
      if (!active) return;
      setLatestVersion(version);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const { saved } = storeRedirectFromSearch(window.location.search);
    if (!saved) return;
    const nextUrl = stripRedirectParam(window.location.href);
    if (!nextUrl || nextUrl === window.location.href) return;
    window.history.replaceState(null, "", nextUrl);
  }, []);

  useEffect(() => {
    if (!insforgeLoaded) return;
    let active = true;
    const refreshSession = () => {
      return insforgeAuthClient.auth
        .getCurrentSession()
        .then(({ data }) => {
          if (!active) return;
          setInsforgeSession(data?.session ?? null);
        })
        .catch(() => {
          if (!active) return;
          setInsforgeSession(null);
        });
    };
    refreshSession();
    return () => {
      active = false;
    };
  }, [insforgeLoaded, insforgeSignedIn]);

  useEffect(() => {
    return subscribeSessionExpired((next) => {
      setSessionExpired(Boolean(next));
    });
  }, []);

  const getInsforgeAccessToken = useCallback(async () => {
    if (!insforgeSignedIn) return null;
    const { data } = await insforgeAuthClient.auth.getCurrentSession();
    return data?.session?.accessToken ?? null;
  }, [insforgeSignedIn]);

  useEffect(() => {
    if (!sessionExpired) {
      lastProbeTokenRef.current = null;
      return;
    }
    if (!insforgeSignedIn) {
      lastProbeTokenRef.current = null;
      return;
    }
    let active = true;
    (async () => {
      const token = await getInsforgeAccessToken();
      if (!active) return;
      if (!token || token === lastProbeTokenRef.current) return;
      lastProbeTokenRef.current = token;
      probeBackend({ baseUrl, accessToken: token }).catch(() => {});
    })();
    return () => {
      active = false;
    };
  }, [baseUrl, getInsforgeAccessToken, insforgeSignedIn, sessionExpired]);

  const insforgeAuth = useMemo(() => {
    if (!insforgeSession?.accessToken) return null;
    const user = insforgeSession.user;
    const profileName = user?.profile?.name;
    const displayName = profileName ?? user?.name ?? null;
    return {
      accessToken: insforgeSession.accessToken,
      getAccessToken: getInsforgeAccessToken,
      userId: user?.id ?? null,
      email: user?.email ?? null,
      name: displayName,
      savedAt: new Date().toISOString(),
    };
  }, [getInsforgeAccessToken, insforgeSession]);

  const redirectOnceRef = useRef(false);
  useEffect(() => {
    if (redirectOnceRef.current) return;
    if (!insforgeSession?.accessToken || sessionExpired) return;
    const target = resolveRedirectTarget(window.location.search);
    if (!target) return;
    const user = insforgeSession.user;
    const profileName = user?.profile?.name;
    const displayName = profileName ?? user?.name ?? null;
    redirectOnceRef.current = true;
    const redirectUrl = buildRedirectUrl(target, {
      accessToken: insforgeSession.accessToken,
      userId: user?.id ?? null,
      email: user?.email ?? null,
      name: displayName,
    });
    window.location.assign(redirectUrl);
  }, [insforgeSession, sessionExpired]);

  const useInsforge = insforgeLoaded && insforgeSignedIn;
  const hasInsforgeSession = Boolean(insforgeSession);
  const hasInsforgeIdentity = Boolean(insforgeSession?.user);
  const signedIn =
    useInsforge && hasInsforgeSession && hasInsforgeIdentity && !sessionExpired;
  const auth = useMemo(() => {
    if (!useInsforge || sessionExpired || !hasInsforgeIdentity) return null;
    return insforgeAuth;
  }, [hasInsforgeIdentity, insforgeAuth, sessionExpired, useInsforge]);
  const signOut = useMemo(() => {
    return async () => {
      if (useInsforge) {
        await insforgeSignOut();
      }
      clearAuthStorage();
      clearSessionExpired();
    };
  }, [insforgeSignOut, useInsforge]);

  const pageUrl = new URL(window.location.href);
  const pathname = pageUrl.pathname.replace(/\/+$/, "");
  const shareMatch = pathname.match(/^\/share\/([^/]+)$/i);
  const publicToken = shareMatch ? shareMatch[1] : null;
  const publicMode = Boolean(publicToken);
  const signInUrl = "/sign-in";
  const signUpUrl = "/sign-up";

  const loadingShell = <div className="min-h-screen bg-[#050505]" />;
  let content = null;
  if (!publicMode && !signedIn && !mockEnabled && !sessionExpired) {
    content = <LandingPage signInUrl={signInUrl} signUpUrl={signUpUrl} />;
  } else {
    content = (
      <Suspense fallback={loadingShell}>
        {!publicMode ? <UpgradeAlertModal requiredVersion={latestVersion} /> : null}
        <DashboardPage
          baseUrl={baseUrl}
          auth={auth}
          signedIn={signedIn}
          sessionExpired={sessionExpired}
          signOut={signOut}
          publicMode={publicMode}
          publicToken={publicToken}
          signInUrl={signInUrl}
          signUpUrl={signUpUrl}
        />
      </Suspense>
    );
  }

  return <ErrorBoundary>{content}</ErrorBoundary>;
}
