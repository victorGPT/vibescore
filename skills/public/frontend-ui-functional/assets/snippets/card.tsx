import type { ReactNode } from "react";

export type CardProps = {
  title: string;
  description?: string;
  children?: ReactNode;
};

export function Card({ title, description, children }: CardProps) {
  return (
    <section className="rounded-lg border border-subtle bg-surface p-4 shadow-sm">
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-primary">{title}</h3>
        {description ? (
          <p className="text-sm text-muted">{description}</p>
        ) : null}
      </div>
      {children ? <div className="mt-3">{children}</div> : null}
    </section>
  );
}
