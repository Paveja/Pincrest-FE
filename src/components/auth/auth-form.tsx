"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiError } from "@/services/api-client";
import { login, register } from "@/services/auth";
import { useAuth } from "@/components/auth/auth-provider";
import { LoadingState } from "@/components/states/loading-state";

export type AuthFormMode = "login" | "register";

type FieldName = "name" | "username" | "email" | "password";
type FormValues = Record<FieldName, string>;
type FieldErrors = Partial<Record<FieldName, string>>;

interface AuthFormProps {
  mode: AuthFormMode;
}

interface TextFieldProps {
  id: FieldName;
  label: string;
  type?: "text" | "email" | "password";
  value: string;
  autoComplete: string;
  error?: string;
  onChange: (value: string) => void;
}

const emptyValues: FormValues = {
  name: "",
  username: "",
  email: "",
  password: "",
};

function TextField({
  id,
  label,
  type = "text",
  value,
  autoComplete,
  error,
  onChange,
}: TextFieldProps) {
  const errorId = `${id}-error`;

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-foreground block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        required
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => onChange(event.target.value)}
        className="border-border bg-surface text-foreground placeholder:text-muted-foreground focus:border-accent min-h-12 w-full rounded-md border px-4 text-base transition-colors outline-none focus:ring-2 focus:ring-[color:var(--accent)]/20 motion-reduce:transition-none"
      />
      {error ? (
        <p id={errorId} className="text-danger text-sm" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function validate(values: FormValues, mode: AuthFormMode): FieldErrors {
  const errors: FieldErrors = {};
  const email = values.email.trim();

  if (mode === "register" && !values.name.trim()) {
    errors.name = "Enter your name.";
  }

  if (mode === "register" && !values.username.trim()) {
    errors.username = "Choose a username.";
  }

  if (!email) {
    errors.email = "Enter your email address.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!values.password) {
    errors.password = "Enter your password.";
  } else if (mode === "register" && values.password.length < 8) {
    errors.password = "Use at least 8 characters.";
  }

  return errors;
}

function getFieldErrors(error: ApiError): FieldErrors {
  const fieldErrors: FieldErrors = {};

  for (const field of ["name", "username", "email", "password"] as const) {
    const message = error.fieldErrors[field];
    if (message) {
      fieldErrors[field] = message;
    }
  }

  return fieldErrors;
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const { status, error: sessionError, refreshSession } = useAuth();
  const [values, setValues] = useState<FormValues>(emptyValues);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isRegister = mode === "register";

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/");
    }
  }, [router, status]);

  function updateField(field: FieldName, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setFormError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const focusFirstError = (errors: FieldErrors) => {
      const firstInvalidField = (Object.keys(errors) as FieldName[])[0];
      if (firstInvalidField) {
        document.getElementById(firstInvalidField)?.focus();
      }
    };
    const errors = validate(values, mode);
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      focusFirstError(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      if (isRegister) {
        await register({
          name: values.name.trim(),
          username: values.username.trim(),
          email: values.email.trim(),
          password: values.password,
        });
      } else {
        await login({
          email: values.email.trim(),
          password: values.password,
        });
      }

      const authenticated = await refreshSession();
      if (!authenticated) {
        setFormError(
          "Your request succeeded, but Pincrest couldn’t confirm your session. Please try again.",
        );
        return;
      }

      router.replace("/");
    } catch (cause) {
      if (cause instanceof ApiError) {
        const apiFieldErrors = getFieldErrors(cause);
        setFieldErrors(apiFieldErrors);
        focusFirstError(apiFieldErrors);
        setFormError(cause.message);
      } else {
        setFormError("We couldn’t complete your request. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (status === "loading") {
    return <LoadingState label="Checking your session…" />;
  }

  if (status === "authenticated") {
    return <LoadingState label="Taking you to your feed…" />;
  }

  return (
    <section className="border-border bg-surface w-full rounded-lg border p-6 shadow-sm sm:p-9">
      <div className="mb-8">
        <p className="text-accent mb-3 text-xs font-semibold tracking-[0.16em] uppercase">
          {isRegister ? "Join Pincrest" : "Your Pincrest account"}
        </p>
        <h1 className="text-foreground text-3xl font-semibold tracking-tight sm:text-[2rem]">
          {isRegister ? "Create your account" : "Welcome back"}
        </h1>
        <p className="text-muted-foreground mt-3 text-sm leading-6">
          {isRegister
            ? "Set up your profile and find your place in the feed."
            : "Sign in to pick up where you left off."}
        </p>
      </div>

      {status === "error" ? (
        <div className="border-danger/30 bg-danger/5 text-danger mb-5 rounded-md border px-4 py-3 text-sm leading-6">
          <p role="alert">
            {sessionError ?? "We couldn’t confirm your session."} You can still
            try signing in below.
          </p>
          <button
            type="button"
            onClick={() => void refreshSession()}
            className="mt-2 min-h-11 rounded-sm font-semibold underline underline-offset-4"
          >
            Retry session check
          </button>
        </div>
      ) : null}

      <form noValidate onSubmit={handleSubmit} className="space-y-5">
        {isRegister ? (
          <>
            <TextField
              id="name"
              label="Name"
              value={values.name}
              autoComplete="name"
              error={fieldErrors.name}
              onChange={(value) => updateField("name", value)}
            />
            <TextField
              id="username"
              label="Username"
              value={values.username}
              autoComplete="username"
              error={fieldErrors.username}
              onChange={(value) => updateField("username", value)}
            />
          </>
        ) : null}

        <TextField
          id="email"
          label="Email address"
          type="email"
          value={values.email}
          autoComplete="email"
          error={fieldErrors.email}
          onChange={(value) => updateField("email", value)}
        />
        <TextField
          id="password"
          label="Password"
          type="password"
          value={values.password}
          autoComplete={isRegister ? "new-password" : "current-password"}
          error={fieldErrors.password}
          onChange={(value) => updateField("password", value)}
        />

        {formError ? (
          <p
            className="border-danger/30 bg-danger/5 text-danger rounded-md border px-4 py-3 text-sm leading-6"
            role="alert"
            aria-live="polite"
          >
            {formError}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          className="bg-accent text-accent-foreground hover:bg-accent-hover focus-visible:outline-accent mt-2 inline-flex min-h-12 w-full items-center justify-center rounded-md px-5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
        >
          {isSubmitting
            ? isRegister
              ? "Creating your account…"
              : "Signing in…"
            : isRegister
              ? "Create account"
              : "Sign in"}
        </button>
      </form>

      <p className="text-muted-foreground mt-7 text-center text-sm">
        {isRegister ? "Already have an account?" : "New to Pincrest?"}{" "}
        <Link
          href={isRegister ? "/login" : "/register"}
          className="text-accent hover:text-accent-hover rounded-sm font-semibold underline decoration-current/40 underline-offset-4"
        >
          {isRegister ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </section>
  );
}
