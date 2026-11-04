"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { BoardEditorDialog } from "@/components/boards/board-editor-dialog";
import { ErrorState } from "@/components/states/error-state";
import { LoadingState } from "@/components/states/loading-state";
import {
  deleteBoard,
  getBoard,
  getBoardPins,
  removePinFromBoard,
  updateBoard,
  type Board,
  type BoardInput,
} from "@/services/boards";
import { getSafeDestinationUrl, type Pin } from "@/services/pins";

interface BoardDetailProps {
  boardId: string;
}

const PIN_IMAGE_RATIOS = ["aspect-[4/5]", "aspect-[3/4]", "aspect-square"];

export function BoardDetail({ boardId }: BoardDetailProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [board, setBoard] = useState<Board | null>(null);
  const [pins, setPins] = useState<Pin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [confirmDeleteBoard, setConfirmDeleteBoard] = useState(false);
  const [confirmRemovePinId, setConfirmRemovePinId] = useState<string | null>(
    null,
  );
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const currentUserId =
    typeof user?.id === "string" || typeof user?.id === "number"
      ? String(user.id)
      : null;
  const isOwner =
    board !== null &&
    currentUserId !== null &&
    currentUserId === String(board.ownerId);

  useEffect(() => {
    let active = true;

    void Promise.all([getBoard(boardId), getBoardPins(boardId)])
      .then(([loadedBoard, loadedPins]) => {
        if (active) {
          setBoard(loadedBoard);
          setPins(loadedPins);
          setLoadError(null);
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          setLoadError(
            cause instanceof Error
              ? cause.message
              : "This Board could not be loaded. Try again.",
          );
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [boardId, retryToken]);

  async function handleSave(input: BoardInput) {
    if (!board) {
      return;
    }

    const updatedBoard = await updateBoard(board.id, input);
    setBoard(updatedBoard);
    setNotice("Your Board was updated.");
    setActionError(null);
    setIsEditorOpen(false);
  }

  async function handleDeleteBoard() {
    if (!board) {
      return;
    }

    setActiveActionId("board");
    setActionError(null);

    try {
      await deleteBoard(board.id);
      router.replace("/boards");
    } catch (cause) {
      setActionError(
        cause instanceof Error
          ? cause.message
          : "The Board could not be deleted. Try again.",
      );
      setConfirmDeleteBoard(false);
    } finally {
      setActiveActionId(null);
    }
  }

  async function handleRemovePin(pin: Pin) {
    if (!board) {
      return;
    }

    const pinId = String(pin.id);
    setActiveActionId(pinId);
    setActionError(null);

    try {
      await removePinFromBoard(board.id, pin.id);
      setPins((currentPins) =>
        currentPins.filter((item) => item.id !== pin.id),
      );
      setConfirmRemovePinId(null);
      setNotice(`${pin.title} was removed from ${board.name}.`);
    } catch (cause) {
      setActionError(
        cause instanceof Error
          ? cause.message
          : "The Pin could not be removed. Try again.",
      );
    } finally {
      setActiveActionId(null);
    }
  }

  if (isLoading) {
    return <LoadingState label="Loading Board" />;
  }

  if (loadError || !board) {
    return (
      <ErrorState
        title="This Board isn’t available"
        description={loadError ?? "The requested Board could not be found."}
        onRetry={() => {
          setIsLoading(true);
          setLoadError(null);
          setRetryToken((current) => current + 1);
        }}
      />
    );
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <Link
        href="/boards"
        className="text-muted-foreground hover:text-foreground inline-flex min-h-11 items-center rounded-md text-sm font-medium transition-colors motion-reduce:transition-none"
      >
        Back to Boards
      </Link>

      <header className="border-border mt-4 flex flex-col justify-between gap-6 border-b pb-7 sm:flex-row sm:items-end sm:pb-8">
        <div className="min-w-0">
          <p className="text-accent mb-3 flex items-center gap-3 text-xs font-semibold tracking-[0.16em] uppercase">
            <span
              aria-hidden="true"
              className="bg-accent h-5 w-1 rounded-full"
            />
            Pincrest / Board
          </p>
          <h1 className="text-foreground text-3xl font-semibold tracking-tight sm:text-4xl">
            {board.name}
          </h1>
          {board.description ? (
            <p className="text-muted-foreground mt-3 max-w-2xl text-sm leading-6 sm:text-base">
              {board.description}
            </p>
          ) : null}
        </div>

        {isOwner ? (
          confirmDeleteBoard ? (
            <div className="border-border bg-surface rounded-lg border p-4 sm:max-w-sm">
              <p className="text-foreground text-sm font-semibold">
                Delete this Board?
              </p>
              <p className="text-muted-foreground mt-1 text-sm leading-5">
                Its saved Pins will be removed from the Board.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteBoard(false)}
                  disabled={activeActionId === "board"}
                  className="border-border text-foreground hover:bg-surface-muted inline-flex min-h-11 items-center justify-center rounded-md border px-3 text-sm font-medium disabled:opacity-60"
                >
                  Keep Board
                </button>
                <button
                  type="button"
                  onClick={() => void handleDeleteBoard()}
                  disabled={activeActionId === "board"}
                  className="bg-danger inline-flex min-h-11 items-center justify-center rounded-md px-3 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
                >
                  {activeActionId === "board" ? "Deleting…" : "Delete Board"}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => {
                  setNotice(null);
                  setActionError(null);
                  setIsEditorOpen(true);
                }}
                className="border-border text-foreground hover:bg-surface-muted inline-flex min-h-11 items-center justify-center rounded-md border px-4 text-sm font-semibold transition-colors motion-reduce:transition-none"
              >
                Edit Board
              </button>
              <button
                type="button"
                onClick={() => setConfirmDeleteBoard(true)}
                className="text-danger hover:bg-danger/5 inline-flex min-h-11 items-center justify-center rounded-md px-4 text-sm font-semibold transition-colors motion-reduce:transition-none"
              >
                Delete
              </button>
            </div>
          )
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

      <section aria-labelledby="board-pins-heading" className="pt-8 sm:pt-10">
        <div className="mb-6 flex items-baseline justify-between gap-4">
          <h2
            id="board-pins-heading"
            className="text-foreground text-xl font-semibold tracking-tight"
          >
            Saved Pins
          </h2>
          <span className="text-muted-foreground text-sm tabular-nums">
            {pins.length} {pins.length === 1 ? "Pin" : "Pins"}
          </span>
        </div>

        {pins.length === 0 ? (
          <div className="border-border bg-surface flex min-h-64 flex-col items-center justify-center rounded-lg border px-6 py-12 text-center">
            <span aria-hidden="true" className="text-accent text-3xl">
              +
            </span>
            <h3 className="text-foreground mt-4 text-xl font-semibold tracking-tight">
              This Board is ready for Pins
            </h3>
            <p className="text-muted-foreground mt-2 max-w-md text-sm leading-6">
              Save a Pin to this Board and it will be waiting here when you need
              it.
            </p>
            {isOwner ? (
              <Link
                href="/"
                className="bg-accent text-accent-foreground hover:bg-accent-hover mt-6 inline-flex min-h-11 items-center justify-center rounded-md px-5 text-sm font-semibold transition-colors motion-reduce:transition-none"
              >
                Browse Pins
              </Link>
            ) : null}
          </div>
        ) : (
          <ul className="columns-2 gap-3 sm:columns-3 sm:gap-4 lg:columns-4 lg:gap-5">
            {pins.map((pin, index) => {
              const destinationUrl = getSafeDestinationUrl(pin.destinationUrl);
              const isConfirming = confirmRemovePinId === String(pin.id);
              const isRemoving = activeActionId === String(pin.id);
              const imageRatio =
                PIN_IMAGE_RATIOS[index % PIN_IMAGE_RATIOS.length];

              return (
                <li key={pin.id} className="mb-4 break-inside-avoid">
                  <article className="group min-w-0">
                    <div
                      className={`bg-surface-muted relative overflow-hidden rounded-2xl ${imageRatio}`}
                    >
                      <Image
                        src={pin.imageUrl}
                        alt={pin.title}
                        fill
                        unoptimized
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.025] motion-reduce:transition-none"
                      />
                    </div>
                    <div className="p-3 sm:p-4">
                      <h3 className="text-foreground line-clamp-2 leading-5 font-semibold">
                        {pin.title}
                      </h3>
                      {pin.description ? (
                        <p className="text-muted-foreground mt-2 line-clamp-3 text-sm leading-5">
                          {pin.description}
                        </p>
                      ) : null}
                      {destinationUrl ? (
                        <a
                          href={destinationUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-accent hover:text-accent-hover mt-2 inline-flex min-h-11 items-center text-sm font-medium break-all underline decoration-current/40 underline-offset-2"
                        >
                          Visit destination
                        </a>
                      ) : null}

                      {isOwner ? (
                        isConfirming ? (
                          <div
                            className="border-border mt-3 border-t pt-3"
                            role="group"
                            aria-label={`Confirm removing ${pin.title}`}
                          >
                            <p className="text-muted-foreground text-sm leading-5">
                              Remove this Pin from the Board?
                            </p>
                            <div className="mt-3 flex gap-2">
                              <button
                                type="button"
                                onClick={() => setConfirmRemovePinId(null)}
                                disabled={isRemoving}
                                className="border-border text-foreground hover:bg-surface-muted inline-flex min-h-11 flex-1 items-center justify-center rounded-md border px-2 text-sm font-medium disabled:opacity-60"
                              >
                                Keep Pin
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleRemovePin(pin)}
                                disabled={isRemoving}
                                className="text-danger hover:bg-danger/5 inline-flex min-h-11 flex-1 items-center justify-center rounded-md px-2 text-sm font-semibold disabled:cursor-wait disabled:opacity-60"
                              >
                                {isRemoving ? "Removing…" : "Remove"}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmRemovePinId(String(pin.id))
                            }
                            className="border-border text-danger hover:bg-danger/5 mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-md border px-3 text-sm font-semibold transition-colors motion-reduce:transition-none"
                          >
                            Remove from Board
                          </button>
                        )
                      ) : null}
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {isEditorOpen ? (
        <BoardEditorDialog
          key={String(board.id)}
          board={board}
          onClose={() => setIsEditorOpen(false)}
          onSave={handleSave}
        />
      ) : null}
    </section>
  );
}
