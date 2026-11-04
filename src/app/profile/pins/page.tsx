import { AppShell } from "@/components/layout/app-shell";
import { PinManagement } from "@/components/pin-management";

export default function MyPinsPage() {
  return (
    <AppShell>
      <PinManagement />
    </AppShell>
  );
}

export const metadata = {
  title: "Your Pins",
};
