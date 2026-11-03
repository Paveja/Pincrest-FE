import { RequireAuth } from "@/components/auth/require-auth";
import { AppShell } from "@/components/layout/app-shell";
import { BoardDetailPage } from "@/components/boards/board-pages";

interface BoardRouteProps {
  params: Promise<{ id: string }>;
}

export default async function BoardRoutePage({ params }: BoardRouteProps) {
  const { id } = await params;

  return (
    <RequireAuth>
      <AppShell>
        <BoardDetailPage key={id} boardId={id} />
      </AppShell>
    </RequireAuth>
  );
}
