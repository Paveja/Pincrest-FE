import { AppShell } from "@/components/layout/app-shell";
import { BoardManagement } from "@/components/boards/board-management";

export default function BoardsPage() {
  return (
    <AppShell>
      <BoardManagement />
    </AppShell>
  );
}

export const metadata = {
  title: "Your Boards",
};
