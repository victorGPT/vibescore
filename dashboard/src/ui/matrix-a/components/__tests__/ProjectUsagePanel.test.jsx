import React from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { render } from "../../../../test/test-utils";
import { ProjectUsagePanel } from "../ProjectUsagePanel.jsx";

describe("ProjectUsagePanel", () => {
  const entry = {
    project_key: "octo/hello",
    project_ref: "https://github.com/octo/hello",
    total_tokens: 12345,
  };

  beforeEach(() => {
    document.documentElement.classList.add("screenshot-capture");
  });

  afterEach(() => {
    document.documentElement.classList.remove("screenshot-capture");
  });

  it("renders a repo card with a corner star slot and three info lines", () => {
    const { container } = render(<ProjectUsagePanel entries={[entry]} />);
    const card = container.querySelector('[data-project-card="true"]');

    expect(card).toBeTruthy();
    expect(card?.querySelector('[data-star-slot="corner"]')).toBeTruthy();
    expect(card?.querySelector('[data-card-line="identity"]')).toBeTruthy();
    expect(card?.querySelector('[data-card-line="repo"]')).toBeTruthy();
    expect(card?.querySelector('[data-card-line="tokens"]')).toBeTruthy();
  });
});
