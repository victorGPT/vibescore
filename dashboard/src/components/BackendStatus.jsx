import React, { useMemo } from "react";

import { useBackendStatus } from "../hooks/use-backend-status.js";
import { ConnectionStatus } from "../ui/matrix-a/components/ConnectionStatus.jsx";

export function BackendStatus({
  baseUrl,
  statusOverride,
  titleOverride,
  onRefresh,
}) {
  const { status, checking, httpStatus, lastCheckedAt, lastOkAt, error, refresh } =
    useBackendStatus({ baseUrl });

  const host = useMemo(() => safeHost(baseUrl), [baseUrl]);
  const uiStatus = useMemo(() => {
    if (statusOverride) return statusOverride;
    if (status === "active") return "STABLE";
    return "LOST";
  }, [status, statusOverride]);

  const title = useMemo(() => {
    if (titleOverride) return titleOverride;
    const meta = [
      `status=${status}`,
      host ? `host=${host}` : null,
      lastCheckedAt ? `checked=${lastCheckedAt}` : null,
      lastOkAt ? `ok=${lastOkAt}` : null,
      httpStatus != null ? `http=${httpStatus}` : null,
      error ? `error=${error}` : null,
      "click=refresh",
    ]
      .filter(Boolean)
      .join(" • ");

    return meta;
  }, [error, host, httpStatus, lastCheckedAt, lastOkAt, status, titleOverride]);

  return (
    <ConnectionStatus
      status={uiStatus}
      onClick={onRefresh || refresh}
      title={title}
      className={checking ? "opacity-80" : ""}
    />
  );
}

function safeHost(baseUrl) {
  try {
    const u = new URL(baseUrl);
    return u.host;
  } catch (_e) {
    return null;
  }
}
