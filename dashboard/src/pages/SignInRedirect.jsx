import React, { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { insforgeAuthClient } from "../lib/insforge-auth-client";
import {
  consumePostAuthPath,
  storePostAuthPathFromSearch,
  storeRedirectFromSearch,
  stripNextParam,
  stripRedirectParam,
} from "../lib/auth-redirect";

function buildCallbackUrl() {
  if (typeof window === "undefined") return "/auth/callback";
  return `${window.location.origin}/auth/callback`;
}

export function SignInRedirect() {
  const callbackUrl = useMemo(() => buildCallbackUrl(), []);
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const { saved } = storeRedirectFromSearch(window.location.search);
    const { saved: nextSaved } = storePostAuthPathFromSearch(
      window.location.search
    );
    if (!saved && !nextSaved) return;

    let nextUrl = window.location.href;
    const strippedRedirect = stripRedirectParam(nextUrl);
    if (strippedRedirect) nextUrl = strippedRedirect;
    const strippedNext = stripNextParam(nextUrl);
    if (strippedNext) nextUrl = strippedNext;
    if (!nextUrl || nextUrl === window.location.href) return;
    window.history.replaceState(null, "", nextUrl);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let active = true;

    const run = async () => {
      try {
        const { data } = await insforgeAuthClient.auth.getCurrentSession();
        if (!active) return;
        if (data?.session?.accessToken) {
          const nextPath = consumePostAuthPath();
          const destination =
            nextPath && nextPath !== "/auth/callback" ? nextPath : "/";
          navigate(destination, { replace: true });
          return;
        }

        const { error } = await insforgeAuthClient.auth.signInWithOAuth({
          provider: "github",
          redirectTo: callbackUrl,
        });
        if (error) {
          // eslint-disable-next-line no-console
          console.error("OAuth init failed:", error);
          navigate("/", { replace: true });
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Sign-in redirect failed:", error);
        navigate("/", { replace: true });
      }
    };

    run();
    return () => {
      active = false;
    };
  }, [callbackUrl, navigate]);

  return <div className="min-h-screen bg-[#050505]" />;
}
