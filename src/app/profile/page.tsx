import { AppShell } from "@/components/layout/app-shell";
import { ProfilePage } from "@/components/profile/profile-page";

export default function MyProfilePage() {
  return (
    <AppShell>
      <ProfilePage mode="mine" />
    </AppShell>
  );
}
