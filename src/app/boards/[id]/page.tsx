import { AppShell } from "@/components/layout/app-shell";
import { BoardDetail } from "@/components/boards/board-detail";

export default async function BoardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <AppShell>
      <BoardDetail boardId={id} />
    </AppShell>
  );
}
