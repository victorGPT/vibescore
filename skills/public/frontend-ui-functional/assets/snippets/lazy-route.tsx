import type { ComponentType, LazyExoticComponent } from "react";
import { Suspense } from "react";

export type LazyRouteBoundaryProps = {
  loadingLabel: string;
  Component: LazyExoticComponent<ComponentType<unknown>>;
};

export function LazyRouteBoundary({
  loadingLabel,
  Component,
}: LazyRouteBoundaryProps) {
  return (
    <Suspense fallback={<div className="text-sm text-muted">{loadingLabel}</div>}>
      <Component />
    </Suspense>
  );
}
