import type { ReactNode } from "react";

export type PageLayoutProps = {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function PageLayout({ title, actions, children }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-subtle px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-primary">{title}</h1>
          {actions ? <div>{actions}</div> : null}
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
