import React from "react";

import { copy } from "../../../lib/copy.js";
import { ActivityHeatmap } from "./ActivityHeatmap.jsx";
import { AsciiBox } from "../../foundation/AsciiBox.jsx";

export function ArchiveHeatmap({
  heatmap,
  title = copy("archive.title"),
  rangeLabel,
  footerLeft = copy("archive.footer.left"),
  footerRight,
  className = "",
}) {
  const showFooter = Boolean(footerLeft || footerRight);

  return (
    <AsciiBox title={title} className={className}>
      <div className="flex flex-col h-full">
        <ActivityHeatmap heatmap={heatmap} />
        {rangeLabel ? (
          <div className="mt-4 text-caption text-matrix-dim uppercase font-bold">
            {copy("shared.range.simple", { range: rangeLabel })}
          </div>
        ) : null}
        {showFooter ? (
          <div className="mt-auto pt-3 border-t border-matrix-ghost text-caption text-matrix-muted flex justify-between uppercase">
            <span>{footerLeft}</span>
            {footerRight ? <span>{footerRight}</span> : null}
          </div>
        ) : null}
      </div>
    </AsciiBox>
  );
}
