interface ErrorStateProps {
  title: string;
  description: string;
  onRetry?: () => void;
}

export function ErrorState({ title, description, onRetry }: ErrorStateProps) {
  return (
    <section
      role="alert"
      className="mx-auto flex min-h-64 max-w-xl flex-col items-center justify-center px-6 py-12 text-center"
    >
      <h1 className="text-foreground text-xl font-semibold tracking-tight">
        {title}
      </h1>
      <p className="text-muted-foreground mt-3 max-w-md text-sm leading-6">
        {description}
      </p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="bg-accent text-accent-foreground hover:bg-accent-hover mt-6 inline-flex min-h-11 items-center justify-center rounded-md px-5 text-sm font-semibold transition-colors motion-reduce:transition-none"
        >
          Try again
        </button>
      ) : null}
    </section>
  );
}
