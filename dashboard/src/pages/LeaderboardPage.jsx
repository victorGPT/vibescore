import React, { useEffect, useMemo, useState } from "react";

import { copy } from "../lib/copy";
import { getLeaderboard } from "../lib/vibeusage-api";
import { isMockEnabled } from "../lib/mock-data";
import { isAccessTokenReady, resolveAuthAccessToken } from "../lib/auth-token";
import {
  buildInjectedTopEntries,
  buildPageItems,
  clampInt,
  getPaginationFlags,
} from "../lib/leaderboard-ui";
import { toDisplayNumber } from "../lib/format";
import { BackendStatus } from "../components/BackendStatus.jsx";
import { AsciiBox } from "../ui/foundation/AsciiBox.jsx";
import { MatrixButton } from "../ui/foundation/MatrixButton.jsx";
import { MatrixShell } from "../ui/foundation/MatrixShell.jsx";
import { GithubStar } from "../ui/matrix-a/components/GithubStar.jsx";

const TOP_LIMIT = 10;
const PAGE_LIMIT = 20;

function normalizeLeaderboardError(err) {
  if (!err) return copy("shared.error.prefix", { error: copy("leaderboard.error.unknown") });
  const msg = err?.message || String(err);
  const safe = String(msg || "").trim() || copy("leaderboard.error.unknown");
  return copy("shared.error.prefix", { error: safe });
}

export function LeaderboardPage({
  baseUrl,
  auth,
  signedIn,
  sessionSoftExpired,
  signOut,
  signInUrl = "/sign-in",
}) {
  const mockEnabled = isMockEnabled();
  const authTokenAllowed = signedIn && !sessionSoftExpired;
  const authAccessToken = useMemo(() => {
    if (!authTokenAllowed) return null;
    if (typeof auth === "function") return auth;
    if (typeof auth?.getAccessToken === "function") {
      return auth.getAccessToken.bind(auth);
    }
    return null;
  }, [auth, authTokenAllowed]);
  const effectiveAuthToken = authTokenAllowed ? authAccessToken : null;
  const authTokenReady = authTokenAllowed && isAccessTokenReady(effectiveAuthToken);

  let headerStatus = null;
  if (authTokenAllowed && authTokenReady) {
    headerStatus = <BackendStatus baseUrl={baseUrl} accessToken={effectiveAuthToken} />;
  }

  const headerRight = (
    <div className="flex items-center gap-4">
      <MatrixButton as="a" size="header" href="/">
        {copy("leaderboard.nav.back")}
      </MatrixButton>
      <GithubStar isFixed={false} size="header" />
      {signedIn ? (
        <MatrixButton onClick={signOut} size="header">
          {copy("dashboard.sign_out")}
        </MatrixButton>
      ) : (
        <MatrixButton as="a" size="header" href={signInUrl}>
          {copy("shared.button.sign_in")}
        </MatrixButton>
      )}
    </div>
  );

  const placeholder = copy("shared.placeholder.short");
  const [topState, setTopState] = useState(() => ({
    loading: false,
    error: null,
    data: null,
  }));
  const [metric, setMetric] = useState("all");
  const [listPage, setListPage] = useState(1);
  const [listState, setListState] = useState(() => ({
    loading: false,
    error: null,
    data: null,
  }));

  useEffect(() => {
    setListPage(1);
  }, [metric]);

  useEffect(() => {
    if (mockEnabled) return;
    if (!authTokenAllowed) return;
    if (authTokenReady) return;
    setTopState({ loading: false, error: null, data: null });
    setListState({ loading: false, error: null, data: null });
  }, [authTokenAllowed, authTokenReady, mockEnabled]);

  useEffect(() => {
    if (!baseUrl) return;
    if (!mockEnabled && (!authTokenAllowed || !authTokenReady)) return;
    let active = true;
    setTopState((prev) => ({ ...prev, loading: true, error: null }));
    (async () => {
      const token = await resolveAuthAccessToken(effectiveAuthToken);
      const data = await getLeaderboard({
        baseUrl,
        accessToken: token,
        metric,
        limit: TOP_LIMIT,
        offset: 0,
      });
      if (!active) return;
      setTopState({ loading: false, error: null, data });
    })().catch((err) => {
      if (!active) return;
      setTopState({ loading: false, error: normalizeLeaderboardError(err), data: null });
    });
    return () => {
      active = false;
    };
  }, [baseUrl, effectiveAuthToken, authTokenAllowed, authTokenReady, metric, mockEnabled]);

  const listOffset = useMemo(() => {
    const safePage = clampInt(listPage, { min: 1, max: 1_000_000, fallback: 1 });
    return (safePage - 1) * PAGE_LIMIT;
  }, [listPage]);

  useEffect(() => {
    if (!baseUrl) return;
    if (!mockEnabled && (!authTokenAllowed || !authTokenReady)) return;
    let active = true;
    setListState((prev) => ({ ...prev, loading: true, error: null }));
    (async () => {
      const token = await resolveAuthAccessToken(effectiveAuthToken);
      const data = await getLeaderboard({
        baseUrl,
        accessToken: token,
        metric,
        limit: PAGE_LIMIT,
        offset: listOffset,
      });
      if (!active) return;
      setListState({ loading: false, error: null, data });
    })().catch((err) => {
      if (!active) return;
      setListState({ loading: false, error: normalizeLeaderboardError(err), data: null });
    });
    return () => {
      active = false;
    };
  }, [baseUrl, effectiveAuthToken, authTokenAllowed, authTokenReady, listOffset, metric, mockEnabled]);

  const topData = topState.data;
  const listData = listState.data;
  const me = listData?.me || topData?.me || null;
  const injectedTop = useMemo(() => {
    return buildInjectedTopEntries({
      topEntries: topData?.entries || [],
      me,
      meLabel: copy("leaderboard.me_label"),
      limit: TOP_LIMIT,
    });
  }, [me, topData?.entries]);

  const totalPages = listData?.total_pages ?? null;
  const currentPage = listData?.page ?? listPage;
  const pageItems = useMemo(() => {
    return buildPageItems(currentPage, totalPages);
  }, [currentPage, totalPages]);

  const from = topData?.from || listData?.from || null;
  const to = topData?.to || listData?.to || null;
  const generatedAt = topData?.generated_at || listData?.generated_at || null;

  const meRankLabel = me?.rank == null ? placeholder : String(me.rank);
  const meTotalLabel = me ? toDisplayNumber(me.total_tokens) : placeholder;
  const meGptLabel = me ? toDisplayNumber(me.gpt_tokens) : placeholder;
  const meClaudeLabel = me ? toDisplayNumber(me.claude_tokens) : placeholder;

  const meStats =
    metric === "gpt"
      ? [
          { key: "gpt", label: copy("leaderboard.column.gpt"), value: meGptLabel },
          { key: "total", label: copy("leaderboard.column.total"), value: meTotalLabel },
          { key: "claude", label: copy("leaderboard.column.claude"), value: meClaudeLabel },
        ]
      : metric === "claude"
        ? [
            { key: "claude", label: copy("leaderboard.column.claude"), value: meClaudeLabel },
            { key: "total", label: copy("leaderboard.column.total"), value: meTotalLabel },
            { key: "gpt", label: copy("leaderboard.column.gpt"), value: meGptLabel },
          ]
        : [
            { key: "total", label: copy("leaderboard.column.total"), value: meTotalLabel },
            { key: "gpt", label: copy("leaderboard.column.gpt"), value: meGptLabel },
            { key: "claude", label: copy("leaderboard.column.claude"), value: meClaudeLabel },
          ];

  const { canPrev, canNext } = getPaginationFlags({ page: currentPage, totalPages });

  let topBody = null;
  if (topState.loading) {
    topBody = (
      <p className="text-[10px] uppercase text-matrix-dim mt-0">{copy("leaderboard.loading")}</p>
    );
  } else if (topState.error) {
    topBody = <p className="text-[10px] uppercase text-matrix-dim mt-0">{topState.error}</p>;
  } else if (injectedTop.length === 0) {
    topBody = <p className="text-[10px] uppercase text-matrix-dim mt-0">{copy("leaderboard.empty")}</p>;
  } else {
    topBody = (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {injectedTop.map((entry) => {
          const isMe = Boolean(entry?.is_me);
          const entryName =
            typeof entry?.display_name === "string" && entry.display_name.trim()
              ? entry.display_name
              : copy("leaderboard.anon_label");
          const name = isMe ? copy("leaderboard.me_label") : entryName;
          const primaryLabel =
            metric === "gpt"
              ? copy("leaderboard.metric.gpt")
              : metric === "claude"
                ? copy("leaderboard.metric.claude")
                : copy("leaderboard.column.total");
          const primaryValue =
            metric === "gpt"
              ? entry?.gpt_tokens
              : metric === "claude"
                ? entry?.claude_tokens
                : entry?.total_tokens;
          const secondaryStats =
            metric === "gpt"
              ? [
                  {
                    key: "total",
                    label: copy("leaderboard.column.total"),
                    value: entry?.total_tokens,
                  },
                  {
                    key: "claude",
                    label: copy("leaderboard.column.claude"),
                    value: entry?.claude_tokens,
                  },
                ]
              : metric === "claude"
                ? [
                    {
                      key: "total",
                      label: copy("leaderboard.column.total"),
                      value: entry?.total_tokens,
                    },
                    {
                      key: "gpt",
                      label: copy("leaderboard.column.gpt"),
                      value: entry?.gpt_tokens,
                    },
                  ]
                : [
                    {
                      key: "gpt",
                      label: copy("leaderboard.column.gpt"),
                      value: entry?.gpt_tokens,
                    },
                    {
                      key: "claude",
                      label: copy("leaderboard.column.claude"),
                      value: entry?.claude_tokens,
                    },
                  ];
          return (
            <div
              key={`top-${entry?.rank}-${name}`}
              className={`matrix-panel rounded-none px-4 py-3 border ${
                isMe
                  ? "border-matrix-primary/60 shadow-[0_0_18px_var(--matrix-glow)]"
                  : "border-matrix-ghost"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] uppercase text-matrix-dim tracking-[0.25em]">
                    {copy("leaderboard.column.rank")} {entry?.rank ?? placeholder}
                  </span>
                  <span className="text-lg font-black truncate">{name}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase text-matrix-dim tracking-[0.25em]">
                    {primaryLabel}
                  </span>
                  <div className="text-lg font-black">{toDisplayNumber(primaryValue)}</div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-[11px]">
                {secondaryStats.map((stat) => (
                  <div key={stat.key} className="flex items-center justify-between gap-2">
                    <span className="uppercase text-matrix-dim">{stat.label}</span>
                    <span className="font-bold">{toDisplayNumber(stat.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  const hasEntries = Array.isArray(listData?.entries) && listData.entries.length !== 0;
  let listBody = null;
  if (listState.loading) {
    listBody = (
      <div className="px-4">
        <p className="text-[10px] uppercase text-matrix-dim mt-0">{copy("leaderboard.loading")}</p>
      </div>
    );
  } else if (listState.error) {
    listBody = (
      <div className="px-4">
        <p className="text-[10px] uppercase text-matrix-dim mt-0">{listState.error}</p>
      </div>
    );
  } else if (hasEntries) {
    listBody = (
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left text-[12px]">
          <thead className="uppercase text-matrix-dim tracking-[0.25em] text-[10px]">
            <tr className="border-b border-matrix-ghost">
              <th className="px-4 py-3">{copy("leaderboard.column.rank")}</th>
              <th className="px-4 py-3">{copy("leaderboard.column.user")}</th>
              <th className="px-4 py-3">{copy("leaderboard.column.total")}</th>
              <th className="px-4 py-3">{copy("leaderboard.column.gpt")}</th>
              <th className="px-4 py-3">{copy("leaderboard.column.claude")}</th>
            </tr>
          </thead>
          <tbody>
            {listData.entries.map((entry) => {
              const isMe = Boolean(entry?.is_me);
              const entryName =
                typeof entry?.display_name === "string" && entry.display_name.trim()
                  ? entry.display_name
                  : copy("leaderboard.anon_label");
              const name = isMe ? copy("leaderboard.me_label") : entryName;
              return (
                <tr
                  key={`row-${entry?.rank}-${name}`}
                  className={`border-b border-matrix-ghost/40 ${
                    isMe ? "bg-matrix-panelStrong/30" : "bg-transparent"
                  }`}
                >
                  <td className="px-4 py-3 font-bold">{entry?.rank ?? placeholder}</td>
                  <td className="px-4 py-3 font-bold truncate max-w-[240px]">{name}</td>
                  <td className="px-4 py-3">{toDisplayNumber(entry?.total_tokens)}</td>
                  <td className="px-4 py-3">{toDisplayNumber(entry?.gpt_tokens)}</td>
                  <td className="px-4 py-3">{toDisplayNumber(entry?.claude_tokens)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  } else {
    listBody = (
      <div className="px-4">
        <p className="text-[10px] uppercase text-matrix-dim mt-0">{copy("leaderboard.empty")}</p>
      </div>
    );
  }

  let pageButtons = null;
  if (typeof totalPages === "number") {
    pageButtons = pageItems.map((p, idx) => {
      if (p == null) {
        return (
          <span
            key={`ellipsis-${idx}`}
            className="text-[10px] uppercase tracking-[0.25em] text-matrix-dim px-2"
          >
            {copy("leaderboard.pagination.ellipsis")}
          </span>
        );
      }
      return (
        <MatrixButton
          key={`page-${p}`}
          size="sm"
          primary={p === currentPage}
          onClick={() => setListPage(p)}
          disabled={listState.loading}
        >
          {String(p)}
        </MatrixButton>
      );
    });
  } else {
    pageButtons = (
      <span className="text-[10px] uppercase tracking-[0.25em] text-matrix-dim">
        {copy("leaderboard.pagination.page_unknown", { page: String(currentPage) })}
      </span>
    );
  }

  return (
    <MatrixShell headerStatus={headerStatus} headerRight={headerRight}>
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h1 className="text-xl md:text-2xl font-black tracking-tight glow-text">
              {copy("leaderboard.title")}
            </h1>
            <div className="text-[10px] uppercase tracking-[0.25em] text-matrix-muted">
              {from && to ? copy("leaderboard.range", { from, to }) : copy("leaderboard.range_loading")}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <MatrixButton
              size="sm"
              primary={metric === "all"}
              onClick={() => setMetric("all")}
              disabled={topState.loading || listState.loading}
            >
              {copy("leaderboard.metric.all")}
            </MatrixButton>
            <MatrixButton
              size="sm"
              primary={metric === "gpt"}
              onClick={() => setMetric("gpt")}
              disabled={topState.loading || listState.loading}
            >
              {copy("leaderboard.metric.gpt")}
            </MatrixButton>
            <MatrixButton
              size="sm"
              primary={metric === "claude"}
              onClick={() => setMetric("claude")}
              disabled={topState.loading || listState.loading}
            >
              {copy("leaderboard.metric.claude")}
            </MatrixButton>
          </div>
          {generatedAt ? (
            <div className="text-[10px] uppercase text-matrix-dim">
              {copy("leaderboard.generated_at", { ts: generatedAt })}
            </div>
          ) : null}
        </div>

        <div className="sticky top-4 z-40">
          <AsciiBox
            title={copy("leaderboard.me_card.title")}
            subtitle={copy("leaderboard.me_card.subtitle")}
            className="matrix-panel-strong"
            bodyClassName="py-4"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-[0.25em] text-matrix-dim">
                  {copy("leaderboard.column.rank")}
                </span>
                <span className="text-2xl md:text-3xl font-black text-matrix-ink-bright glow-text">
                  {meRankLabel}
                </span>
              </div>
              {meStats.map((stat) => (
                <div key={stat.key} className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-[0.25em] text-matrix-dim">
                    {stat.label}
                  </span>
                  <span className="text-xl md:text-2xl font-black">{stat.value}</span>
                </div>
              ))}
            </div>
          </AsciiBox>
        </div>

        <AsciiBox
          title={copy("leaderboard.top10.title")}
          subtitle={copy("leaderboard.top10.subtitle")}
          className=""
        >
          {topBody}
        </AsciiBox>

        <AsciiBox
          title={copy("leaderboard.table.title")}
          subtitle={copy("leaderboard.table.subtitle")}
          className=""
          bodyClassName="px-0"
        >
          {listBody}

          <div className="px-4 py-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <MatrixButton
                size="sm"
                onClick={() => setListPage((p) => Math.max(1, p - 1))}
                disabled={!canPrev || listState.loading}
              >
                {copy("leaderboard.pagination.prev")}
              </MatrixButton>
              <MatrixButton
                size="sm"
                onClick={() => setListPage((p) => p + 1)}
                disabled={!canNext || listState.loading}
              >
                {copy("leaderboard.pagination.next")}
              </MatrixButton>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {pageButtons}
            </div>
          </div>
        </AsciiBox>
      </div>
    </MatrixShell>
  );
}
