import React, { useMemo, useState } from "react";

import { buildAuthUrl } from "../lib/auth-url.js";
import { getDefaultRange } from "../lib/date-range.js";
import { DAILY_SORT_COLUMNS, sortDailyRows } from "../lib/daily.js";
import { toDisplayNumber } from "../lib/format.js";
import { useUsageData } from "../hooks/use-usage-data.js";
import { AppShell } from "../components/AppShell.jsx";
import { AppWindow } from "../components/AppWindow.jsx";
import { MatrixRain } from "../components/MatrixRain.jsx";
import { Sparkline } from "../components/Sparkline.jsx";

export function DashboardPage({ baseUrl, auth, signedIn, signOut }) {
  const defaultRange = useMemo(() => getDefaultRange(), []);
  const [from, setFrom] = useState(defaultRange.from);
  const [to, setTo] = useState(defaultRange.to);

  const { daily, summary, loading, error, refresh } = useUsageData({
    baseUrl,
    accessToken: auth?.accessToken || null,
    from,
    to,
  });

  const [sort, setSort] = useState(() => ({ key: "day", dir: "desc" }));
  const sortedDaily = useMemo(() => sortDailyRows(daily, sort), [daily, sort]);
  const sparklineRows = useMemo(
    () => sortDailyRows(daily, { key: "day", dir: "asc" }),
    [daily]
  );

  function toggleSort(key) {
    setSort((prev) => {
      if (prev.key === key) return { key, dir: prev.dir === "asc" ? "desc" : "asc" };
      return { key, dir: "desc" };
    });
  }

  function ariaSortFor(key) {
    if (sort.key !== key) return "none";
    return sort.dir === "asc" ? "ascending" : "descending";
  }

  function sortIconFor(key) {
    if (sort.key !== key) return "";
    return sort.dir === "asc" ? "^" : "v";
  }

  const isLocalhost = useMemo(() => {
    const h = window.location.hostname;
    return h === "localhost" || h === "127.0.0.1";
  }, []);
  const installInitCmd = isLocalhost
    ? "node bin/tracker.js init"
    : "npx --yes @vibescore/tracker init";
  const installSyncCmd = isLocalhost
    ? "node bin/tracker.js sync"
    : "npx --yes @vibescore/tracker sync";

  const redirectUrl = useMemo(() => `${window.location.origin}/auth/callback`, []);
  const signInUrl = useMemo(
    () => buildAuthUrl({ baseUrl, path: "/auth/sign-in", redirectUrl }),
    [baseUrl, redirectUrl]
  );
  const signUpUrl = useMemo(
    () => buildAuthUrl({ baseUrl, path: "/auth/sign-up", redirectUrl }),
    [baseUrl, redirectUrl]
  );

  const headerRight = signedIn ? (
    <div className="row" style={{ justifyContent: "flex-end" }}>
      <span className="muted">{auth?.email ? auth.email : "Signed in"}</span>
      <button className="btn" onClick={signOut}>
        Sign out
      </button>
    </div>
  ) : (
    <span className="muted">Not signed in</span>
  );

  return (
    <AppShell
      title="VibeScore"
      background={<MatrixRain />}
      right={headerRight}
      footer={
        signedIn ? "UTC aggregates • click Refresh to reload" : "Sign in to view UTC token aggregates"
      }
    >
      {!signedIn ? (
        <AppWindow title="Auth required">
          <p className="muted" style={{ marginTop: 0 }}>
            Sign in / sign up to view your daily token usage (UTC).
          </p>

          <div className="row" style={{ marginTop: 12 }}>
            <a className="btn primary" href={signInUrl}>
              $ sign-in
            </a>
            <a className="btn" href={signUpUrl}>
              $ sign-up
            </a>
          </div>
        </AppWindow>
      ) : (
        <>
          <AppWindow title="Install">
            <p className="muted" style={{ marginTop: 0 }}>
              1) run <code>{installInitCmd}</code>
              <br />
              2) use Codex CLI normally
              <br />
              3) run <code>{installSyncCmd}</code> (or wait for auto sync)
            </p>
          </AppWindow>

          <AppWindow title="Query" right={<span className="muted">UTC</span>}>
            <div className="row">
              <label className="muted">
                From&nbsp;
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              </label>
              <label className="muted">
                To&nbsp;
                <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
              </label>
              <button className="btn primary" disabled={loading} onClick={refresh}>
                {loading ? "Loading…" : "Refresh"}
              </button>
              <div className="spacer" />
              <span className="muted">{baseUrl.replace(/^https?:\/\//, "")}</span>
            </div>

            {error ? (
              <div className="muted" style={{ marginTop: 12, color: "var(--error)" }}>
                Error: {error}
              </div>
            ) : null}
          </AppWindow>

          <AppWindow title="Metrics">
            <div className="grid">
              <div className="metric">
                <div className="label">Total</div>
                <div className="value">{toDisplayNumber(summary?.total_tokens)}</div>
              </div>
              <div className="metric">
                <div className="label">Input</div>
                <div className="value">{toDisplayNumber(summary?.input_tokens)}</div>
              </div>
              <div className="metric">
                <div className="label">Output</div>
                <div className="value">{toDisplayNumber(summary?.output_tokens)}</div>
              </div>
              <div className="metric">
                <div className="label">Cached input</div>
                <div className="value">{toDisplayNumber(summary?.cached_input_tokens)}</div>
              </div>
              <div className="metric">
                <div className="label">Reasoning output</div>
                <div className="value">{toDisplayNumber(summary?.reasoning_output_tokens)}</div>
              </div>
            </div>
          </AppWindow>

          <AppWindow title="Sparkline">
            <Sparkline rows={sparklineRows} />
          </AppWindow>

          <AppWindow title="Daily totals">
            {daily.length === 0 ? (
              <div className="muted">
                No data yet. Use Codex CLI then run <code>{installSyncCmd}</code>.
              </div>
            ) : (
              <div
                className="tui-table-scroll"
                role="region"
                aria-label="Daily totals table"
                tabIndex={0}
              >
                <table>
                  <thead>
                    <tr>
                      {DAILY_SORT_COLUMNS.map((c) => (
                        <th key={c.key} aria-sort={ariaSortFor(c.key)}>
                          <button
                            type="button"
                            className="tui-th-btn"
                            onClick={() => toggleSort(c.key)}
                            title={c.title}
                          >
                            {c.label}{" "}
                            <span
                              className={`tui-sort-indicator ${sort.key === c.key ? "active" : ""}`}
                            >
                              {sortIconFor(c.key)}
                            </span>
                          </button>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedDaily.map((r) => (
                      <tr key={String(r.day)}>
                        <td>{String(r.day)}</td>
                        <td>{toDisplayNumber(r.total_tokens)}</td>
                        <td>{toDisplayNumber(r.input_tokens)}</td>
                        <td>{toDisplayNumber(r.output_tokens)}</td>
                        <td>{toDisplayNumber(r.cached_input_tokens)}</td>
                        <td>{toDisplayNumber(r.reasoning_output_tokens)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </AppWindow>
        </>
      )}
    </AppShell>
  );
}

