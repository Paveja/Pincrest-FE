"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import {
  AuthApiError,
  registerAccount,
  validateRegistration,
  type FieldErrors,
  type RegistrationValues,
} from "@/lib/auth";
import { AuthLoading, SessionNotice, useAuth } from "./AuthProvider";
import { FormField } from "./FormField";

const emptyValues: RegistrationValues = {
  name: "",
  username: "",
  email: "",
  password: "",
};

export function RegisterForm() {
  const router = useRouter();
  const { status, refreshSession } = useAuth();
  const [values, setValues] = useState(emptyValues);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/feed");
    }
  }, [router, status]);

  if (status === "checking" || status === "authenticated") {
    return <AuthLoading label="Getting Pincrest ready" />;
  }

  function updateField(field: keyof RegistrationValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setApiError("");
    setSuccessMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setApiError("");
    setSuccessMessage("");

    const validationErrors = validateRegistration(values);
    setFieldErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      await registerAccount(values);
      const session = await refreshSession();

      if (session === "authenticated") {
        router.replace("/feed");
      } else if (session === "anonymous") {
        setSuccessMessage(
          "Your account is ready. Sign in with your email and password to continue.",
        );
      } else {
        setSuccessMessage(
          "Your account was created, but we couldn't check your session. Sign in to continue.",
        );
      }
    } catch (error) {
      if (error instanceof AuthApiError) {
        setFieldErrors(error.fieldErrors);
        setApiError(error.message);
      } else {
        setApiError("We couldn't create your account. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <SessionNotice />
      <p className="form-kicker">Make yourself at home</p>
      <h2 className="auth-heading">Create your account</h2>
      <p className="auth-subtitle">A few details, then you’re on your way.</p>

      <form className="auth-form" noValidate onSubmit={handleSubmit}>
        {apiError && (
          <p className="form-error-summary" role="alert">
            {apiError}
          </p>
        )}
        {successMessage && (
          <p className="session-notice" role="status">
            {successMessage}
          </p>
        )}

        <FormField
          id="name"
          label="Name"
          type="text"
          value={values.name}
          placeholder="Your name"
          autoComplete="name"
          error={fieldErrors.name}
          onChange={(value) => updateField("name", value)}
        />
        <FormField
          id="username"
          label="Username"
          type="text"
          value={values.username}
          placeholder="Choose a username"
          autoComplete="username"
          error={fieldErrors.username}
          onChange={(value) => updateField("username", value)}
        />
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
          placeholder="At least 8 characters"
          autoComplete="new-password"
          error={fieldErrors.password}
          onChange={(value) => updateField("password", value)}
        />

        <button className="submit-button" type="submit" disabled={isSubmitting}>
          {isSubmitting && (
            <span className="button-spinner" aria-hidden="true" />
          )}
          {isSubmitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="auth-switch">
        Already have an account? <Link href="/login">Sign in</Link>
      </p>
    </>
  );
}
