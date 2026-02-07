import React from "react";
import { Button } from "@base-ui/react/button";

export function MatrixButton({
  as: Comp = "button",
  children,
  primary = false,
  size = "default",
  className = "",
  ...props
}) {
  const base =
    size === "header"
      ? "matrix-header-chip matrix-header-action text-caption uppercase font-bold tracking-[0.2em] select-none"
      : "inline-flex items-center justify-center px-3 py-2 border text-caption uppercase font-bold transition-colors select-none";
  const variant =
    size === "header"
      ? "text-matrix-primary"
      : primary
        ? "bg-matrix-primary text-black border-matrix-primary hover:bg-white hover:border-white"
        : "bg-matrix-panel text-matrix-primary border-matrix-ghost hover:bg-matrix-panelStrong hover:border-matrix-dim";
  const disabled =
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-matrix-panel";

  const mergedClassName = `${base} ${variant} ${disabled} ${className}`;

  if (Comp === "button") {
    return (
      <Button className={mergedClassName} {...props} type={props.type}>
        {children}
      </Button>
    );
  }

  const userRole = props.role;

  return (
    <Button
      className={mergedClassName}
      {...props}
      nativeButton={false}
      render={(renderProps) => {
        const { children: renderChildren, role: resolvedRole, ...rest } =
          renderProps;

        const role =
          Comp === "a" && userRole === undefined ? undefined : resolvedRole;

        return (
          <Comp {...rest} role={role}>
            {renderChildren}
          </Comp>
        );
      }}
    >
      {children}
    </Button>
  );
}
