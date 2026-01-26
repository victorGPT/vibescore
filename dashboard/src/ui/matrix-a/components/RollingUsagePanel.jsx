import React from "react";

import { copy } from "../../../lib/copy";
import { toDisplayNumber } from "../../../lib/format";
import { AsciiBox } from "../../foundation/AsciiBox.jsx";

export const RollingUsagePanel = React.memo(function RollingUsagePanel({
  rolling,
  className = "",
}) {
  const placeholder = copy("shared.placeholder.short");
  const formatValue = (value) => {
    if (value == null) return placeholder;
    return toDisplayNumber(value);
  };

  const items = [
    {
      key: "last_7d",
      label: copy("dashboard.rolling.last_7d"),
      value: formatValue(rolling?.last_7d?.totals?.billable_total_tokens),
    },
    {
      key: "last_30d",
      label: copy("dashboard.rolling.last_30d"),
      value: formatValue(rolling?.last_30d?.totals?.billable_total_tokens),
    },
    {
      key: "avg_active_day",
      label: copy("dashboard.rolling.avg_active_day"),
      value: formatValue(rolling?.last_30d?.avg_per_active_day),
    },
  ];

  return (
    <AsciiBox
      title={copy("dashboard.rolling.title")}
      className={className}
      bodyClassName="py-4"
    >
      <div className="grid gap-4 md:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.key}
            className="flex flex-col items-center text-center gap-2 border border-matrix-ghost px-3 py-4"
          >
            <span className="text-caption uppercase font-bold text-matrix-muted tracking-[0.2em]">
              {item.label}
            </span>
            <span className="text-2xl md:text-3xl font-black text-matrix-bright tabular-nums">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </AsciiBox>
  );
});
