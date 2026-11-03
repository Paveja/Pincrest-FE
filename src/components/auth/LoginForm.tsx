"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import {
  AuthApiError,
  loginAccount,
  validateLogin,
  type FieldErrors,
  type LoginValues,
} from "@/lib/auth";
import { AuthLoading, SessionNotice, useAuth } from "./AuthProvider";
import { FormField } from "./FormField";

const emptyValues: LoginValues = { email: "", password: "" };

export function LoginForm() {
  const router = useRouter();
  const { status, refreshSession } = useAuth();
  const [values, setValues] = useState(emptyValues);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/feed");
    }
  }, [router, status]);

  if (status === "checking" || status === "authenticated") {
    return <AuthLoading label="Taking you to your feed" />;
  }

  function updateField(field: keyof LoginValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setApiError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setApiError("");

    const validationErrors = validateLogin(values);
    setFieldErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      await loginAccount(values);
      const session = await refreshSession();

      if (session === "authenticated") {
        router.replace("/feed");
      } else {
        setApiError("We couldn't confirm your sign-in. Please try again.");
      }
    } catch (error) {
      if (error instanceof AuthApiError) {
        setFieldErrors(error.fieldErrors);
        setApiError(error.message);
      } else {
        setApiError("We couldn't sign you in. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <SessionNotice />
      <p className="form-kicker">Welcome back</p>
      <h2 className="auth-heading">Sign in to Pincrest</h2>
      <p className="auth-subtitle">
        Pick up where you left off. Your place is waiting.
      </p>

      <form className="auth-form" noValidate onSubmit={handleSubmit}>
        {apiError && (
          <p className="form-error-summary" role="alert">
            {apiError}
          </p>
        )}

        <FormField
          id="email"
          label="Email address"
          type="email"
          value={values.email}
          placeholder="you@example.com"
          autoComplete="email"
          error={fieldErrors.email}
          onChange={(value) => updateField("email", value)}
        />
        <FormField
          id="password"
          label="Password"
          type="password"
          value={values.password}
          placeholder="Enter your password"
          autoComplete="current-password"
          error={fieldErrors.password}
          onChange={(value) => updateField("password", value)}
        />

        <button className="submit-button" type="submit" disabled={isSubmitting}>
          {isSubmitting && (
            <span className="button-spinner" aria-hidden="true" />
          )}
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="auth-switch">
        New to Pincrest? <Link href="/register">Create an account</Link>
      </p>
    </>
  );
}
