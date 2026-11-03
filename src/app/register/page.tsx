import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthPageLayout } from "@/components/auth/auth-page-layout";

export const metadata: Metadata = {
  title: "Create account",
};

export default function RegisterPage() {
  return (
    <AuthPageLayout>
      <AuthForm mode="register" />
    </AuthPageLayout>
  );
}
