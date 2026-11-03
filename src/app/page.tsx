import { AppShell } from "@/components/layout/app-shell";
import { PinManagement } from "@/components/pin-management";

export default function HomePage() {
  return (
    <AppShell>
      <PinManagement />
    </AppShell>
  );
}
