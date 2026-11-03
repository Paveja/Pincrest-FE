import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthPageLayout } from "@/components/auth/auth-page-layout";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <AuthPageLayout>
      <AuthForm mode="login" />
    </AuthPageLayout>
  );
}
