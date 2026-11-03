import { RequireAuth } from "@/components/auth/require-auth";
import { AppShell } from "@/components/layout/app-shell";
import { BoardCollectionPage } from "@/components/boards/board-pages";

export default function BoardsPage() {
  return (
    <RequireAuth>
      <AppShell>
        <BoardCollectionPage />
      </AppShell>
    </RequireAuth>
  );
}
