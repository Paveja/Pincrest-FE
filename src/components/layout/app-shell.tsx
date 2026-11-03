import type { ReactNode } from "react";
import { AppHeader } from "@/components/layout/app-header";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <main id="main-content" className="min-h-[calc(100vh-4.5rem)]">
        {children}
      </main>
    </div>
  );
}
