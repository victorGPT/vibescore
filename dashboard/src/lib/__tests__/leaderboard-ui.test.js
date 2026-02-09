import { describe, expect, it } from "vitest";

import { getPaginationFlags, injectMeIntoFirstPage } from "../leaderboard-ui";

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

describe("injectMeIntoFirstPage", () => {
  it("injects me at position 5 and keeps real rank", () => {
    const entries = Array.from({ length: 20 }, (_, i) => ({
      rank: i + 1,
      is_me: false,
      display_name: "Anonymous",
      avatar_url: null,
      gpt_tokens: "1",
      claude_tokens: "2",
      total_tokens: "3",
    }));

    const me = { rank: 399, gpt_tokens: "10", claude_tokens: "20", total_tokens: "30" };
    const injected = injectMeIntoFirstPage({ entries, me, meLabel: "YOU", limit: 20 });

    expect(injected).toHaveLength(20);
    expect(injected[3]?.rank).toBe(5);
    expect(injected.some((entry) => entry.rank === 4)).toBe(false);
    expect(injected[4]?.is_me).toBe(true);
    expect(injected[4]?.rank).toBe(399);
    expect(injected[4]?.total_tokens).toBe("30");
  });

  it("does not inject when current page already includes me", () => {
    const entries = Array.from({ length: 20 }, (_, i) => ({
      rank: i + 1,
      is_me: false,
      display_name: "Anonymous",
      avatar_url: null,
      gpt_tokens: "1",
      claude_tokens: "2",
      total_tokens: "3",
    }));
    entries[12].is_me = true;

    const me = { rank: 399, gpt_tokens: "10", claude_tokens: "20", total_tokens: "30" };
    const injected = injectMeIntoFirstPage({ entries, me, meLabel: "YOU", limit: 20 });

    expect(injected).toEqual(entries);
  });

  it("does not inject when me rank is missing", () => {
    const entries = Array.from({ length: 20 }, (_, i) => ({
      rank: i + 1,
      is_me: false,
      display_name: "Anonymous",
      avatar_url: null,
      gpt_tokens: "1",
      claude_tokens: "2",
      total_tokens: "3",
    }));

    const me = { rank: null, gpt_tokens: "10", claude_tokens: "20", total_tokens: "30" };
    const injected = injectMeIntoFirstPage({ entries, me, meLabel: "YOU", limit: 20 });

    expect(injected).toEqual(entries);
  });
});
