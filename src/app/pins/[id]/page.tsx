import { RequireAuth } from "@/components/auth/require-auth";
import { AppShell } from "@/components/layout/app-shell";
import { PinDetailPage } from "@/components/pins/pin-pages";

interface PinRouteProps {
  params: Promise<{ id: string }>;
}

export default async function PinRoutePage({ params }: PinRouteProps) {
  const { id } = await params;

  return (
    <RequireAuth>
      <AppShell>
        <PinDetailPage key={id} pinId={id} />
      </AppShell>
    </RequireAuth>
  );
}
