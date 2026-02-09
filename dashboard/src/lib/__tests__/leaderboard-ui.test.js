import { describe, expect, it } from "vitest";

import { buildInjectedTopEntries, getPaginationFlags } from "../leaderboard-ui";

describe("getPaginationFlags", () => {
  it("keeps next enabled when totalPages is unknown", () => {
    const flags = getPaginationFlags({ page: 1, totalPages: null });
    expect(flags.canPrev).toBe(false);
    expect(flags.canNext).toBe(true);
  });

  it("disables next when totalPages is 0", () => {
    const flags = getPaginationFlags({ page: 1, totalPages: 0 });
    expect(flags.canPrev).toBe(false);
    expect(flags.canNext).toBe(false);
  });

  it("disables next when on last page", () => {
    const flags = getPaginationFlags({ page: 5, totalPages: 5 });
    expect(flags.canPrev).toBe(true);
    expect(flags.canNext).toBe(false);
  });
});

describe("buildInjectedTopEntries", () => {
  it("injects me into Top10 and keeps real rank", () => {
    const topEntries = Array.from({ length: 10 }, (_, i) => ({
      rank: i + 1,
      is_me: false,
      display_name: "Anonymous",
      avatar_url: null,
      gpt_tokens: "1",
      claude_tokens: "2",
      total_tokens: "3",
    }));

    const me = { rank: 399, gpt_tokens: "10", claude_tokens: "20", total_tokens: "30" };
    const injected = buildInjectedTopEntries({ topEntries, me, meLabel: "YOU", limit: 10 });

    expect(injected).toHaveLength(10);
    expect(injected.slice(0, 9).map((e) => e.rank)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(injected[9]?.is_me).toBe(true);
    expect(injected[9]?.rank).toBe(399);
    expect(injected[9]?.total_tokens).toBe("30");
  });

  it("does not inject when me is already within limit", () => {
    const topEntries = Array.from({ length: 10 }, (_, i) => ({
      rank: i + 1,
      is_me: false,
      display_name: "Anonymous",
      avatar_url: null,
      gpt_tokens: "1",
      claude_tokens: "2",
      total_tokens: "3",
    }));

    const me = { rank: 7, gpt_tokens: "10", claude_tokens: "20", total_tokens: "30" };
    const injected = buildInjectedTopEntries({ topEntries, me, meLabel: "YOU", limit: 10 });

    expect(injected).toEqual(topEntries);
  });
});

