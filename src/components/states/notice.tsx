interface NoticeProps {
  tone?: "success" | "error";
  children: string;
}

/** Compact pill for confirmation and action-error messages. */
export function Notice({ tone = "success", children }: NoticeProps) {
  if (tone === "error") {
    return (
      <p
        role="alert"
        className="bg-danger/10 text-danger mx-auto my-4 w-fit max-w-full rounded-full px-5 py-2.5 text-sm font-medium"
      >
        {children}
      </p>
    );
  }

  return (
    <p
      role="status"
      className="bg-foreground text-background mx-auto my-4 w-fit max-w-full rounded-full px-5 py-2.5 text-sm font-medium"
    >
      {children}
    </p>
  );
}
