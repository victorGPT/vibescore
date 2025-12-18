import React from "react";

export function AppShell({ title, right, footer, background, children }) {
  return (
    <div className="tui-screen">
      {background}
      <div className="tui-frame">
        <div className="tui-header">
          <div className="tui-title">{title}</div>
          <div className="tui-spacer" />
          {right}
        </div>
        <div className="tui-body">{children}</div>
        <div className="tui-footer">
          <span className="muted">{footer}</span>
        </div>
      </div>
    </div>
  );
}

