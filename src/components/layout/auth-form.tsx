"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ApiError } from "@/services/api-client";
import { useAuth } from "@/components/layout/auth-provider";

type AuthMode = "login" | "register";
type AuthField = "name" | "username" | "email" | "password";
type FieldErrors = Partial<Record<AuthField, string>>;

interface AuthFormProps {
  mode: AuthMode;
}

interface FormValues {
  name: string;
  username: string;
  email: string;
  password: string;
}

const initialValues: FormValues = {
  name: "",
  username: "",
  email: "",
  password: "",
};

function getFieldForError(error: ApiError): AuthField | null {
  const details = `${error.code ?? ""} ${error.message}`.toLowerCase();
  const fields: AuthField[] = ["username", "email", "password", "name"];

  return fields.find((field) => details.includes(field)) ?? null;
}

function AuthFieldInput({
  autoComplete,
  error,
  id,
  label,
  onChange,
  type = "text",
  value,
}: {
  autoComplete: string;
  error?: string;
  id: AuthField;
  label: string;
  onChange: (value: string) => void;
  type?: "email" | "password" | "text";
  value: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-foreground block text-sm font-medium" htmlFor={id}>
        {label}
      </label>
      <input
        autoComplete={autoComplete}
        className="border-border bg-surface text-foreground placeholder:text-muted-foreground focus:border-accent min-h-12 w-full rounded-md border px-3.5 text-base transition-colors outline-none focus:ring-2 focus:ring-[color:var(--accent)]/20 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
        id={id}
        name={id}
        onChange={(event) => onChange(event.target.value)}
        required
        type={type}
        value={value}
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={error ? true : undefined}
      />
      {error ? (
        <p className="text-danger text-sm" id={`${id}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function AuthForm({ mode }: AuthFormProps) {
  const { login, register } = useAuth();
  const [values, setValues] = useState(initialValues);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isRegistration = mode === "register";

  function updateField(field: AuthField, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setFormError(null);
  }

  function validate(): FieldErrors {
    const errors: FieldErrors = {};

    if (isRegistration && !values.name.trim()) {
      errors.name = "Enter your name.";
    }

    if (isRegistration && !values.username.trim()) {
      errors.username = "Enter a username.";
    }

    if (!values.email.trim()) {
      errors.email = "Enter your email address.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      errors.email = "Enter a valid email address.";
    }

    if (!values.password) {
      errors.password = "Enter your password.";
    }

    return errors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validate();
    setFieldErrors(errors);
    setFormError(null);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (isRegistration) {
        await register({
          name: values.name.trim(),
          username: values.username.trim(),
          email: values.email.trim(),
          password: values.password,
        });
      } else {
        await login(values.email.trim(), values.password);
      }
    } catch (cause) {
      if (cause instanceof ApiError) {
        const field = getFieldForError(cause);

        if (
          field &&
          (isRegistration || field === "email" || field === "password")
        ) {
          setFieldErrors((current) => ({ ...current, [field]: cause.message }));
        } else {
          setFormError(cause.message);
        }
      } else {
        setFormError("Something went wrong. Try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-12 sm:px-8">
      <section className="bg-surface border-border w-full max-w-md rounded-lg border p-6 shadow-sm sm:p-9">
        <div
          aria-label="Pincrest"
          className="text-accent inline-flex min-h-11 items-center gap-2 text-sm font-semibold tracking-wide"
        >
          <span
            aria-hidden="true"
            className="bg-accent text-accent-foreground grid size-8 place-items-center rounded-md text-sm font-bold"
          >
            P
          </span>
          PINCREST
        </div>

        <div className="mt-8">
          <h1 className="text-foreground text-2xl font-semibold tracking-tight">
            {isRegistration ? "Create your account" : "Welcome back"}
          </h1>
          <p className="text-muted-foreground mt-2 text-sm leading-6">
            {isRegistration
              ? "Set up your Pincrest account to get started."
              : "Sign in to continue to your Pincrest workspace."}
          </p>
        </div>

        <form className="mt-7 space-y-5" noValidate onSubmit={handleSubmit}>
          {isRegistration ? (
            <>
              <AuthFieldInput
                autoComplete="name"
                error={fieldErrors.name}
                id="name"
                label="Name"
                onChange={(value) => updateField("name", value)}
                value={values.name}
              />
              <AuthFieldInput
                autoComplete="username"
                error={fieldErrors.username}
                id="username"
                label="Username"
                onChange={(value) => updateField("username", value)}
                value={values.username}
              />
            </>
          ) : null}

          <AuthFieldInput
            autoComplete="email"
            error={fieldErrors.email}
            id="email"
            label="Email"
            onChange={(value) => updateField("email", value)}
            type="email"
            value={values.email}
          />
          <AuthFieldInput
            autoComplete={isRegistration ? "new-password" : "current-password"}
            error={fieldErrors.password}
            id="password"
            label="Password"
            onChange={(value) => updateField("password", value)}
            type="password"
            value={values.password}
          />

          {formError ? (
            <p
              className="border-danger/30 bg-danger/5 text-danger rounded-md border px-3.5 py-3 text-sm leading-5"
              role="alert"
            >
              {formError}
            </p>
          ) : null}

          <button
            className="bg-accent text-accent-foreground hover:bg-accent-hover focus-visible:outline-accent inline-flex min-h-12 w-full items-center justify-center rounded-md px-5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting
              ? isRegistration
                ? "Creating account…"
                : "Signing in…"
              : isRegistration
                ? "Create account"
                : "Sign in"}
          </button>
        </form>

        <p className="text-muted-foreground mt-6 text-center text-sm leading-6">
          {isRegistration ? "Already have an account? " : "New to Pincrest? "}
          <Link
            className="text-accent hover:text-accent-hover rounded-sm font-semibold underline-offset-4 hover:underline"
            href={isRegistration ? "/login" : "/register"}
          >
            {isRegistration ? "Sign in" : "Create an account"}
          </Link>
        </p>
      </section>
    </main>
  );
}
