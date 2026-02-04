import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation } from "react-router-dom";

import { useAuth as useInsforgeAuth } from "@insforge/react-router";

import { getInsforgeBaseUrl } from "./lib/config";
import { ErrorBoundary } from "./components/ErrorBoundary.jsx";
import { LandingPage } from "./pages/LandingPage.jsx";
import { isMockEnabled } from "./lib/mock-data";
import { fetchLatestTrackerVersion } from "./lib/npm-version";
import { isScreenshotModeEnabled } from "./lib/screenshot-mode";
import { getAppVersion } from "./lib/app-version";
import { resolveAuthGate } from "./lib/auth-gate";
import {
  getSafeSessionStorage,
  shouldRedirectFromAuthCallback,
} from "./lib/auth-callback";
import {
  clearAuthStorage,
  clearSessionExpired,
  clearSessionSoftExpired,
  loadSessionExpired,
  loadSessionSoftExpired,
  subscribeSessionExpired,
  subscribeSessionSoftExpired,
} from "./lib/auth-storage";
import {
  buildRedirectUrl,
  resolveRedirectTarget,
  storeRedirectFromSearch,
  stripRedirectParam,
} from "./lib/auth-redirect";
import { insforgeAuthClient } from "./lib/insforge-auth-client";

import { UpgradeAlertModal } from "./ui/matrix-a/components/UpgradeAlertModal.jsx";
import { VersionBadge } from "./ui/matrix-a/components/VersionBadge.jsx";

const DashboardPage = React.lazy(() =>
  import("./pages/DashboardPage.jsx").then((mod) => ({
    default: mod.DashboardPage,
  }))
);
const LeaderboardPage = React.lazy(() =>
  import("./pages/LeaderboardPage.jsx").then((mod) => ({
    default: mod.LeaderboardPage,
  }))
);

export default function App() {
  const location = useLocation();
  const baseUrl = useMemo(() => getInsforgeBaseUrl(), []);
  const {
    isLoaded: insforgeLoaded,
    isSignedIn: insforgeSignedIn,
    signOut: insforgeSignOut,
  } = useInsforgeAuth();
  const mockEnabled = isMockEnabled();
  const screenshotMode = useMemo(() => {
    if (typeof window === "undefined") return false;
    return isScreenshotModeEnabled(window.location.search);
  }, []);
  const appVersion = useMemo(() => getAppVersion(import.meta.env), []);
  const [latestVersion, setLatestVersion] = useState(null);
  const [insforgeSession, setInsforgeSession] = useState();
  const [sessionExpired, setSessionExpired] = useState(() =>
    loadSessionExpired()
  );
  const [sessionSoftExpired, setSessionSoftExpired] = useState(() =>
    loadSessionSoftExpired()
  );

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
    if (!insforgeLoaded) {
      setInsforgeSession(undefined);
      return;
    }
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

  useEffect(() => {
    return subscribeSessionSoftExpired((next) => {
      setSessionSoftExpired(Boolean(next));
    });
  }, []);

  const getInsforgeAccessToken = useCallback(async () => {
    if (!insforgeSignedIn) return null;
    const { data } = await insforgeAuthClient.auth.getCurrentSession();
    return data?.session?.accessToken ?? null;
  }, [insforgeSignedIn]);

  useEffect(() => {
    if (!sessionSoftExpired) return () => {};
    if (!insforgeSignedIn) return () => {};
    let active = true;
    const revalidate = async () => {
      if (!active) return;
      if (document.visibilityState && document.visibilityState !== "visible") {
        return;
      }
      try {
        const { data } = await insforgeAuthClient.auth.getCurrentSession();
        if (!active) return;
        if (data?.session?.accessToken) {
          clearSessionSoftExpired();
        }
      } catch (_e) {
        // ignore refresh errors
      }
    };
    const onVisibilityChange = () => {
      if (!active) return;
      if (document.visibilityState === "visible") {
        revalidate();
      }
    };
    const onFocus = () => {
      revalidate();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", onFocus);
    revalidate();
    return () => {
      active = false;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", onFocus);
    };
  }, [insforgeSignedIn, sessionSoftExpired]);

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
  const signedIn = useInsforge && hasInsforgeSession && hasInsforgeIdentity;
  const auth = useMemo(() => {
    if (!useInsforge || !hasInsforgeIdentity) return null;
    return insforgeAuth;
  }, [hasInsforgeIdentity, insforgeAuth, useInsforge]);
  const signOut = useMemo(() => {
    return async () => {
      if (useInsforge) {
        await insforgeSignOut();
      }
      clearAuthStorage();
      clearSessionExpired();
      clearSessionSoftExpired();
    };
  }, [insforgeSignOut, useInsforge]);

  const pageUrl = new URL(window.location.href);
  const sharePathname = pageUrl.pathname.replace(/\/+$/, "");
  const shareMatch = sharePathname.match(/^\/share\/([^/]+)$/i);
  const publicToken = shareMatch ? shareMatch[1] : null;
  const publicMode = Boolean(publicToken);
  const signInUrl = "/sign-in";
  const signUpUrl = "/sign-up";

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!insforgeLoaded) return;
    const shouldRedirect = shouldRedirectFromAuthCallback({
      pathname: window.location.pathname,
      search: window.location.search,
      hasSession: Boolean(insforgeSession?.accessToken),
      sessionResolved: insforgeSession !== undefined,
      storage: getSafeSessionStorage(),
    });
    if (!shouldRedirect) return;
    window.location.replace(signInUrl);
  }, [insforgeLoaded, insforgeSession, signInUrl]);

  const loadingShell = <div className="min-h-screen bg-[#050505]" />;
  const authPending =
    !publicMode &&
    !mockEnabled &&
    !sessionSoftExpired &&
    (!insforgeLoaded ||
      (insforgeLoaded && insforgeSignedIn && insforgeSession === undefined));
  const gate = resolveAuthGate({
    publicMode,
    mockEnabled,
    sessionSoftExpired,
    signedIn,
    authPending,
  });
  const pathname = location?.pathname || "/";
  const isRankings = pathname.startsWith("/rankings");
  const PageComponent = isRankings ? LeaderboardPage : DashboardPage;
  let content = null;
  if (gate === "loading") {
    content = loadingShell;
  } else if (gate === "landing") {
    content = <LandingPage signInUrl={signInUrl} signUpUrl={signUpUrl} />;
  } else {
    content = (
      <Suspense fallback={loadingShell}>
        {!publicMode && !screenshotMode ? (
          <UpgradeAlertModal requiredVersion={latestVersion} />
        ) : null}
        <PageComponent
          baseUrl={baseUrl}
          auth={auth}
          signedIn={signedIn}
          sessionSoftExpired={sessionSoftExpired}
          signOut={signOut}
          publicMode={publicMode}
          publicToken={publicToken}
          signInUrl={signInUrl}
          signUpUrl={signUpUrl}
        />
      </Suspense>
    );
  }

  return (
    <ErrorBoundary>
      {content}
      {!screenshotMode ? <VersionBadge version={appVersion} /> : null}
    </ErrorBoundary>
  );
}
