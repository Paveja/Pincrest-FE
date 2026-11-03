import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AuthGate } from "@/components/layout/auth-gate";
import { AuthProvider } from "@/components/layout/auth-provider";
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
        <AuthProvider>
          <AuthGate>{children}</AuthGate>
        </AuthProvider>
      </body>
    </html>
  );
}
