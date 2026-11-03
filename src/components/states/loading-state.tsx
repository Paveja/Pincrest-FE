interface LoadingStateProps {
  label?: string;
}

export function LoadingState({ label = "Loading" }: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="text-muted-foreground flex min-h-48 flex-col items-center justify-center gap-4 text-sm"
    >
      <span
        aria-hidden="true"
        className="border-border border-t-accent size-6 animate-spin rounded-full border-2 motion-reduce:animate-none"
      />
      <span>{label}</span>
    </div>
  );
}
