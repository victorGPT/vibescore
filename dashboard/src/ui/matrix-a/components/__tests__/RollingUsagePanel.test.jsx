import { render, screen } from "@testing-library/react";

import { copy } from "../../../../lib/copy";
import { toDisplayNumber } from "../../../../lib/format";
import { RollingUsagePanel } from "../RollingUsagePanel.jsx";

it("renders rolling usage values", () => {
  const rolling = {
    last_7d: {
      totals: { billable_total_tokens: "12000" },
      active_days: 3,
      avg_per_active_day: "4000",
    },
    last_30d: {
      totals: { billable_total_tokens: "30000" },
      active_days: 10,
      avg_per_active_day: "3000",
    },
  };

  render(<RollingUsagePanel rolling={rolling} />);

  expect(screen.getByText(copy("dashboard.rolling.title"))).toBeInTheDocument();
  expect(screen.getByText(copy("dashboard.rolling.last_7d"))).toBeInTheDocument();
  expect(screen.getByText(copy("dashboard.rolling.last_30d"))).toBeInTheDocument();
  expect(screen.getByText(copy("dashboard.rolling.avg_active_day"))).toBeInTheDocument();

  expect(screen.getByText(toDisplayNumber("12000"))).toBeInTheDocument();
  expect(screen.getByText(toDisplayNumber("30000"))).toBeInTheDocument();
  expect(screen.getByText(toDisplayNumber("3000"))).toBeInTheDocument();
});
