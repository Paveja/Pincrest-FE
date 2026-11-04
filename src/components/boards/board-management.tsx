"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { BoardEditorDialog } from "@/components/boards/board-editor-dialog";
import { ErrorState } from "@/components/states/error-state";
import { LoadingState } from "@/components/states/loading-state";
import { Notice } from "@/components/states/notice";
import {
  createBoard,
  deleteBoard,
  getMyBoards,
  getPublicBoards,
  updateBoard,
  type Board,
  type BoardInput,
} from "@/services/boards";

interface BoardManagementProps {
  username?: string;
}

export function BoardManagement({ username }: BoardManagementProps) {
  const { user } = useAuth();
  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [editorBoard, setEditorBoard] = useState<Board | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [deletingBoardId, setDeletingBoardId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const isMine = username === undefined;
  const currentUserId =
    typeof user?.id === "string" || typeof user?.id === "number"
      ? String(user.id)
      : null;
  const displayName = isMine ? "Your" : `@${username}’s`;

  useEffect(() => {
    const controller = new AbortController();
    const request = isMine
      ? getMyBoards(controller.signal)
      : getPublicBoards(username ?? "", controller.signal);

    void request
      .then((loadedBoards) => {
        setBoards(loadedBoards);
        setLoadError(null);
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setLoadError(
            cause instanceof Error
              ? cause.message
              : "Boards could not be loaded. Try again.",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [isMine, refreshToken, username]);

  async function handleSave(input: BoardInput) {
    if (editorBoard) {
      const updatedBoard = await updateBoard(editorBoard.id, input);
      setBoards((currentBoards) =>
        currentBoards.map((board) =>
          board.id === updatedBoard.id ? updatedBoard : board,
        ),
      );
      setNotice("Your Board was updated.");
    } else {
      const createdBoard = await createBoard(input);
      setBoards((currentBoards) => [createdBoard, ...currentBoards]);
      setNotice("Your Board was created.");
    }

    setActionError(null);
    setIsEditorOpen(false);
  }

  async function handleDelete(board: Board) {
    setIsDeleting(true);
    setActionError(null);
    setNotice(null);

    try {
      await deleteBoard(board.id);
      setBoards((currentBoards) =>
        currentBoards.filter((item) => item.id !== board.id),
      );
      setDeletingBoardId(null);
      setNotice(`${board.name} was deleted.`);
    } catch (cause) {
      setActionError(
        cause instanceof Error
          ? cause.message
          : "The Board could not be deleted. Try again.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  function openEditor(board: Board | null) {
    setNotice(null);
    setActionError(null);
    setEditorBoard(board);
    setIsEditorOpen(true);
  }

  return (
    <section className="mx-auto w-full max-w-[120rem] px-3 pt-4 pb-12 sm:px-5">
      <header className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-foreground text-3xl font-semibold tracking-tight sm:text-4xl">
          {displayName} Boards
        </h1>
        <p className="text-muted-foreground max-w-xl text-sm leading-6 sm:text-base">
          {isMine
            ? "Gather the Pins you want to return to in one place."
            : `Explore the public collections shared by @${username}.`}
        </p>
        {!isLoading && !loadError ? (
          <p className="text-muted-foreground text-sm">
            {boards.length} {boards.length === 1 ? "Board" : "Boards"}
          </p>
        ) : null}
        {isMine ? (
          <button
            type="button"
            onClick={() => openEditor(null)}
            className="bg-accent text-accent-foreground hover:bg-accent-hover mt-2 inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold transition-colors motion-reduce:transition-none"
          >
            <span aria-hidden="true" className="text-xl leading-none">
              +
            </span>
            Create Board
          </button>
        ) : null}
      </header>

      {notice ? <Notice>{notice}</Notice> : null}
      {actionError ? <Notice tone="error">{actionError}</Notice> : null}

      {isLoading ? (
        <div className="mt-8">
          <LoadingState label="Loading Boards" />
        </div>
      ) : loadError ? (
        <ErrorState
          title="Boards aren’t available"
          description={loadError}
          onRetry={() => {
            setIsLoading(true);
            setLoadError(null);
            setRefreshToken((current) => current + 1);
          }}
        />
      ) : boards.length === 0 ? (
        <div className="bg-surface-muted mx-auto mt-8 flex min-h-72 max-w-2xl flex-col items-center justify-center rounded-3xl px-6 py-12 text-center">
          <span
            aria-hidden="true"
            className="bg-surface text-foreground grid size-14 place-items-center rounded-full text-3xl"
          >
            +
          </span>
          <h2 className="text-foreground mt-4 text-xl font-semibold tracking-tight">
            {isMine ? "Your first Board starts here" : "No public Boards yet"}
          </h2>
          <p className="text-muted-foreground mt-2 max-w-md text-sm leading-6">
            {isMine
              ? "Create a Board, then save Pins to build a collection around an idea or place."
              : `@${username} hasn’t shared any Boards yet.`}
          </p>
          {isMine ? (
            <button
              type="button"
              onClick={() => openEditor(null)}
              className="bg-accent text-accent-foreground hover:bg-accent-hover mt-6 inline-flex min-h-12 items-center justify-center rounded-full px-6 text-sm font-semibold transition-colors motion-reduce:transition-none"
            >
              Create your first Board
            </button>
          ) : null}
        </div>
      ) : (
        <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {boards.map((board) => {
            const coverImage = safeImageUrl(board.coverImage);
            const canManage =
              isMine &&
              currentUserId !== null &&
              currentUserId === String(board.ownerId);

            return (
              <li key={board.id} className="min-w-0">
                <article>
                  <Link
                    href={`/boards/${encodeURIComponent(String(board.id))}`}
                    className="group block rounded-3xl"
                  >
                    <div className="bg-surface-muted relative aspect-[4/3] overflow-hidden rounded-3xl">
                      {coverImage ? (
                        <Image
                          src={coverImage}
                          alt=""
                          fill
                          unoptimized
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 17vw"
                          className="object-cover transition-transform duration-300 group-hover:scale-[1.04] motion-reduce:transition-none"
                        />
                      ) : (
                        <div className="text-muted-foreground/60 grid h-full place-items-center text-6xl font-semibold tracking-tight">
                          {board.name.trim().charAt(0).toLocaleUpperCase() ||
                            "B"}
                        </div>
                      )}
                    </div>
                    <h2 className="text-foreground mt-2 truncate px-1 text-base font-semibold">
                      {board.name}
                    </h2>
                    <p className="text-muted-foreground line-clamp-1 px-1 text-sm">
                      {board.description || "No description"}
                    </p>
                  </Link>

                  {canManage ? (
                    deletingBoardId === String(board.id) ? (
                      <div
                        className="bg-surface-muted mt-3 rounded-3xl px-4 py-3"
                        role="group"
                        aria-label={`Confirm deleting ${board.name}`}
                      >
                        <p className="text-foreground text-sm leading-5">
                          Delete this Board? Its saved Pins will be removed from
                          the Board.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setDeletingBoardId(null)}
                            disabled={isDeleting}
                            className="bg-surface text-foreground hover:bg-border inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-semibold disabled:opacity-60"
                          >
                            Keep Board
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(board)}
                            disabled={isDeleting}
                            className="bg-danger inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
                          >
                            {isDeleting ? "Deleting…" : "Delete Board"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-1 flex gap-1">
                        <button
                          type="button"
                          onClick={() => openEditor(board)}
                          className="text-foreground hover:bg-surface-muted inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-semibold transition-colors motion-reduce:transition-none"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingBoardId(String(board.id))}
                          className="text-danger hover:bg-danger/10 inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-semibold transition-colors motion-reduce:transition-none"
                        >
                          Delete
                        </button>
                      </div>
                    )
                  ) : null}
                </article>
              </li>
            );
          })}
        </ul>
      )}

      {isEditorOpen ? (
        <BoardEditorDialog
          key={editorBoard ? String(editorBoard.id) : "create-board"}
          board={editorBoard}
          onClose={() => setIsEditorOpen(false)}
          onSave={handleSave}
        />
      ) : null}
    </section>
  );
}

function safeImageUrl(value: string | null): string | null {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.href
      : null;
  } catch {
    return null;
  }
}
