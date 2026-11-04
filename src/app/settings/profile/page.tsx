import { RequireAuth } from "@/components/auth/require-auth";
import { AppShell } from "@/components/layout/app-shell";
import { ProfileEditor } from "@/components/profile/profile-editor";

export default function EditProfilePage() {
  return (
    <AppShell>
      <RequireAuth>
        <ProfileEditor />
      </RequireAuth>
    </AppShell>
  );
}
