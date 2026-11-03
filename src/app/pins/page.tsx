import { RequireAuth } from "@/components/auth/require-auth";
import { AppShell } from "@/components/layout/app-shell";
import { PinCollectionPage } from "@/components/pins/pin-pages";

export default function PinsPage() {
  return (
    <RequireAuth>
      <AppShell>
        <PinCollectionPage />
      </AppShell>
    </RequireAuth>
  );
}
