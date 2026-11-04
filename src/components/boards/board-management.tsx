"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { BoardEditorDialog } from "@/components/boards/board-editor-dialog";
import { ErrorState } from "@/components/states/error-state";
import { LoadingState } from "@/components/states/loading-state";
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
    <section className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <header className="border-border flex flex-col justify-between gap-6 border-b pb-7 sm:flex-row sm:items-end sm:pb-8">
        <div>
          <p className="text-accent mb-3 flex items-center gap-3 text-xs font-semibold tracking-[0.16em] uppercase">
            <span
              aria-hidden="true"
              className="bg-accent h-5 w-1 rounded-full"
            />
            Pincrest / Boards
          </p>
          <h1 className="text-foreground text-3xl font-semibold tracking-tight sm:text-4xl">
            {displayName} Boards
          </h1>
          <p className="text-muted-foreground mt-3 max-w-xl text-sm leading-6 sm:text-base">
            {isMine
              ? "Gather the Pins you want to return to in one place."
              : `Explore the public collections shared by @${username}.`}
          </p>
        </div>
        {isMine ? (
          <button
            type="button"
            onClick={() => openEditor(null)}
            className="bg-accent text-accent-foreground hover:bg-accent-hover inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-md px-5 text-sm font-semibold transition-colors motion-reduce:transition-none"
          >
            <span aria-hidden="true" className="text-xl leading-none">
              +
            </span>
            Create Board
          </button>
        ) : null}
      </header>

      {notice ? (
        <p role="status" className="text-accent mt-5 text-sm font-medium">
          {notice}
        </p>
      ) : null}
      {actionError ? (
        <p role="alert" className="text-danger mt-5 text-sm font-medium">
          {actionError}
        </p>
      ) : null}

      <div className="mt-8 flex min-h-8 items-center justify-between gap-4">
        <h2 className="text-foreground text-lg font-semibold tracking-tight">
          {isMine ? "Your collection" : "Public Boards"}
        </h2>
        {!isLoading && !loadError ? (
          <p className="text-muted-foreground text-sm">
            {boards.length} {boards.length === 1 ? "Board" : "Boards"}
          </p>
        ) : null}
      </div>

      {isLoading ? (
        <div className="mt-5">
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
        <div className="border-border bg-surface mt-5 flex min-h-72 flex-col items-center justify-center rounded-lg border px-6 py-12 text-center">
          <span aria-hidden="true" className="text-accent text-3xl">
            +
          </span>
          <h3 className="text-foreground mt-4 text-xl font-semibold tracking-tight">
            {isMine ? "Your first Board starts here" : "No public Boards yet"}
          </h3>
          <p className="text-muted-foreground mt-2 max-w-md text-sm leading-6">
            {isMine
              ? "Create a Board, then save Pins to build a collection around an idea or place."
              : `@${username} hasn’t shared any Boards yet.`}
          </p>
          {isMine ? (
            <button
              type="button"
              onClick={() => openEditor(null)}
              className="bg-accent text-accent-foreground hover:bg-accent-hover mt-6 inline-flex min-h-11 items-center justify-center rounded-md px-5 text-sm font-semibold transition-colors motion-reduce:transition-none"
            >
              Create your first Board
            </button>
          ) : null}
        </div>
      ) : (
        <ul className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {boards.map((board) => {
            const coverImage = safeImageUrl(board.coverImage);
            const canManage =
              isMine &&
              currentUserId !== null &&
              currentUserId === String(board.ownerId);

            return (
              <li key={board.id} className="min-w-0">
                <article className="border-border bg-surface overflow-hidden rounded-lg border">
                  <Link
                    href={`/boards/${encodeURIComponent(String(board.id))}`}
                    className="group block focus-visible:outline-offset-[-3px]"
                  >
                    <div className="bg-surface-muted relative aspect-[16/9] overflow-hidden">
                      {coverImage ? (
                        <Image
                          src={coverImage}
                          alt=""
                          fill
                          unoptimized
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover transition-transform duration-300 group-hover:scale-[1.025] motion-reduce:transition-none"
                        />
                      ) : (
                        <div className="border-border border-b-accent flex h-full items-end border-b-4 p-5">
                          <span className="text-accent/25 text-6xl leading-none font-semibold tracking-tight">
                            {board.name.trim().charAt(0).toLocaleUpperCase() ||
                              "B"}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-4 sm:p-5">
                      <h3 className="text-foreground group-hover:text-accent text-lg font-semibold tracking-tight transition-colors motion-reduce:transition-none">
                        {board.name}
                      </h3>
                      {board.description ? (
                        <p className="text-muted-foreground mt-2 line-clamp-3 text-sm leading-6">
                          {board.description}
                        </p>
                      ) : (
                        <p className="text-muted-foreground mt-2 text-sm leading-6">
                          No description
                        </p>
                      )}
                    </div>
                  </Link>

                  {canManage ? (
                    deletingBoardId === String(board.id) ? (
                      <div
                        className="border-border border-t px-4 py-4 sm:px-5"
                        role="group"
                        aria-label={`Confirm deleting ${board.name}`}
                      >
                        <p className="text-muted-foreground text-sm leading-5">
                          Delete this Board? Its saved Pins will be removed from
                          the Board.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setDeletingBoardId(null)}
                            disabled={isDeleting}
                            className="border-border text-foreground hover:bg-surface-muted inline-flex min-h-11 items-center justify-center rounded-md border px-3 text-sm font-medium disabled:opacity-60"
                          >
                            Keep Board
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(board)}
                            disabled={isDeleting}
                            className="bg-danger inline-flex min-h-11 items-center justify-center rounded-md px-3 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
                          >
                            {isDeleting ? "Deleting…" : "Delete Board"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="border-border flex gap-2 border-t px-4 py-3 sm:px-5">
                        <button
                          type="button"
                          onClick={() => openEditor(board)}
                          className="border-border text-foreground hover:bg-surface-muted inline-flex min-h-11 flex-1 items-center justify-center rounded-md border px-3 text-sm font-semibold transition-colors motion-reduce:transition-none"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingBoardId(String(board.id))}
                          className="text-danger hover:bg-danger/5 inline-flex min-h-11 flex-1 items-center justify-center rounded-md px-3 text-sm font-semibold transition-colors motion-reduce:transition-none"
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
