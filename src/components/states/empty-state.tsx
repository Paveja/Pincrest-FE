import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <section
      role="status"
      className="mx-auto flex min-h-64 max-w-xl flex-col items-center justify-center px-6 py-12 text-center"
    >
      <h1 className="text-foreground text-xl font-semibold tracking-tight">
        {title}
      </h1>
      <p className="text-muted-foreground mt-3 max-w-md text-sm leading-6">
        {description}
      </p>
      {action ? <div className="mt-6">{action}</div> : null}
    </section>
  );
}
