import React, { useMemo } from "react";

import { buildAuthUrl } from "../lib/auth-url.js";
import { AppShell } from "../components/AppShell.jsx";
import { AppWindow } from "../components/AppWindow.jsx";
import { MatrixRain } from "../components/MatrixRain.jsx";

export function ConnectCliPage({ defaultInsforgeBaseUrl }) {
  const url = useMemo(() => new URL(window.location.href), []);
  const redirect = url.searchParams.get("redirect") || "";
  const baseUrlOverride = url.searchParams.get("base_url") || "";

  let redirectUrl = null;
  try {
    redirectUrl = new URL(redirect);
  } catch (_e) {}

  const safeRedirect =
    redirectUrl &&
    redirectUrl.protocol === "http:" &&
    (redirectUrl.hostname === "127.0.0.1" || redirectUrl.hostname === "localhost")
      ? redirectUrl.toString()
      : null;

  const insforgeBaseUrl = baseUrlOverride || defaultInsforgeBaseUrl;

  const signInUrl = useMemo(() => {
    if (!safeRedirect) return null;
    return buildAuthUrl({
      baseUrl: insforgeBaseUrl,
      path: "/auth/sign-in",
      redirectUrl: safeRedirect,
    });
  }, [insforgeBaseUrl, safeRedirect]);

  const signUpUrl = useMemo(() => {
    if (!safeRedirect) return null;
    return buildAuthUrl({
      baseUrl: insforgeBaseUrl,
      path: "/auth/sign-up",
      redirectUrl: safeRedirect,
    });
  }, [insforgeBaseUrl, safeRedirect]);

  return (
    <AppShell
      title="VibeScore"
      background={<MatrixRain />}
      right={<span className="muted">Connect CLI</span>}
      footer="Click sign-in/sign-up. On success, your browser returns to the local CLI callback."
    >
      <AppWindow title="Link your CLI">
        <p className="muted" style={{ marginTop: 0 }}>
          Sign in or sign up. When finished, the browser will return to your local
          CLI to complete setup.
        </p>

        {!safeRedirect ? (
          <div className="muted" style={{ marginTop: 12, color: "var(--error)" }}>
            Invalid or missing <code>redirect</code> URL. This page must be opened
            from the CLI.
          </div>
        ) : (
          <div className="row" style={{ marginTop: 12 }}>
            <a className="btn primary" href={signInUrl}>
              $ sign-in
            </a>
            <a className="btn" href={signUpUrl}>
              $ sign-up
            </a>
          </div>
        )}
      </AppWindow>
    </AppShell>
  );
}

