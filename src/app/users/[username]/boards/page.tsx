import { AppShell } from "@/components/layout/app-shell";
import { BoardManagement } from "@/components/boards/board-management";

export default async function PublicUserBoardsPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  return (
    <AppShell>
      <BoardManagement username={username} />
    </AppShell>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  return { title: `@${username}’s Boards` };
}
