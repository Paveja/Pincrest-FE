import { RequireAuth } from "@/components/auth/require-auth";
import { AppShell } from "@/components/layout/app-shell";
import { ProfilePage } from "@/components/profile/profile-page";

export default function MyProfilePage() {
  return (
    <AppShell>
      <RequireAuth>
        <ProfilePage mode="mine" />
      </RequireAuth>
    </AppShell>
  );
}
