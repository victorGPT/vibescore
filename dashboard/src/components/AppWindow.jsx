import React from "react";

export function AppWindow({ title, right, children }) {
  return (
    <div className="tui-window">
      <div className="tui-window-bar">
        <div className="tui-window-title">{title}</div>
        <div className="tui-spacer" />
        {right}
      </div>
      <div className="tui-window-body">{children}</div>
    </div>
  );
}

