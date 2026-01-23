import React, { useMemo } from "react";

import { useBackendStatus } from "../hooks/use-backend-status";
import { copy } from "../lib/copy";
import { ConnectionStatus } from "../ui/matrix-a/components/ConnectionStatus.jsx";
export function BackendStatus({
  baseUrl,
  accessToken,
  statusOverride,
  titleOverride,
}) {
  const { status, checking, httpStatus, lastCheckedAt, lastOkAt, error, refresh } =
    useBackendStatus({ baseUrl, accessToken });

  const host = useMemo(() => safeHost(baseUrl), [baseUrl]);
  const uiStatus = useMemo(() => {
    if (statusOverride) return statusOverride;
    if (status === "active") return "STABLE";
    if (status === "down") return "LOST";
    return "UNSTABLE";
  }, [status, statusOverride]);

  const title = useMemo(() => {
    if (titleOverride) return titleOverride;
    const meta = [
      `${copy("backend.meta.status_label")}=${status}`,
      host ? `${copy("backend.meta.host_label")}=${host}` : null,
      lastCheckedAt ? `${copy("backend.meta.checked_label")}=${lastCheckedAt}` : null,
      lastOkAt ? `${copy("backend.meta.ok_label")}=${lastOkAt}` : null,
      httpStatus != null ? `${copy("backend.meta.http_label")}=${httpStatus}` : null,
      error ? `${copy("backend.meta.error_label")}=${error}` : null,
    ]
      .filter(Boolean)
      .join(" • ");

    return meta;
  }, [
    error,
    host,
    httpStatus,
    lastCheckedAt,
    lastOkAt,
    status,
    titleOverride,
  ]);

  return (
    <ConnectionStatus
      status={uiStatus}
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
