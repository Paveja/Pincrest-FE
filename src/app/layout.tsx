import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { AuthProvider } from "@/components/auth-provider";
import { LoadingState } from "@/components/states/loading-state";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Pincrest",
    template: "%s | Pincrest",
  },
  description: "The Pincrest frontend application.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="min-h-full antialiased">
      <body className="min-h-full">
        <Suspense
          fallback={
            <main className="min-h-screen px-6 py-12">
              <LoadingState label="Checking your session" />
            </main>
          }
        >
          <AuthProvider>{children}</AuthProvider>
        </Suspense>
      </body>
    </html>
  );
}
