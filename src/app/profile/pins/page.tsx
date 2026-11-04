import { RequireAuth } from "@/components/auth/require-auth";
import { AppShell } from "@/components/layout/app-shell";
import { PinManagement } from "@/components/pin-management";

export default function MyPinsPage() {
  return (
    <AppShell>
      <RequireAuth>
        <PinManagement />
      </RequireAuth>
    </AppShell>
  );
}

export const metadata = {
  title: "Your Pins",
};
