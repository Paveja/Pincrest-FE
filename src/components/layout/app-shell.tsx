import type { ReactNode } from "react";
import { AppHeader } from "@/components/layout/app-header";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main id="main-content" className="flex-1">
        {children}
      </main>
    </div>
  );
}
