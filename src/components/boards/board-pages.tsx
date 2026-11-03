"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BoardForm } from "@/components/boards/board-form";
import { PinCard } from "@/components/pins/pin-card";
import { ErrorState } from "@/components/states/error-state";
import { LoadingState } from "@/components/states/loading-state";
import {
  createBoard,
  deleteBoard,
  getBoard,
  getBoardPins,
  getMyBoards,
  removePinFromBoard,
  updateBoard,
  type BoardInput,
} from "@/services/boards";
import type { Board, Pin } from "@/services/content";

function getErrorMessage(cause: unknown): string {
  return cause instanceof Error
    ? cause.message
    : "Your Boards could not be loaded. Check your connection and try again.";
}

export function BoardCollectionPage() {
  const [boards, setBoards] = useState<Board[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    void getMyBoards(controller.signal)
      .then((result) => {
        setBoards(result);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          console.error("Unable to load the member's Boards.", cause);
          setError(getErrorMessage(cause));
        }
      });

    return () => controller.abort();
  }, [retryCount]);

  async function handleCreateBoard(input: BoardInput) {
    const createdBoard = await createBoard(input);
    setBoards((current) =>
      current ? [createdBoard, ...current] : [createdBoard],
    );
    setIsCreating(false);
  }

  if (error) {
    return (
      <section className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <ErrorState
          title="Your Boards could not be loaded"
          description={error}
          onRetry={() => {
            setBoards(null);
            setError(null);
            setRetryCount((current) => current + 1);
          }}
        />
      </section>
    );
  }

  if (!boards) {
    return <LoadingState label="Loading your Boards…" />;
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <header className="mb-9 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-accent mb-3 text-xs font-semibold tracking-[0.16em] uppercase">
            Pincrest / Your collections
          </p>
          <h1 className="text-foreground text-3xl font-semibold tracking-tight sm:text-4xl">
            Your Boards
          </h1>
          <p className="text-muted-foreground mt-3 max-w-xl text-sm leading-6 sm:text-base">
            Keep the ideas you save grouped in collections of your own.
          </p>
        </div>
        {!isCreating ? (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="bg-accent text-accent-foreground hover:bg-accent-hover inline-flex min-h-11 items-center justify-center rounded-md px-5 text-sm font-semibold transition-colors motion-reduce:transition-none"
          >
            Create Board
          </button>
        ) : null}
      </header>

      {isCreating ? (
        <div className="mb-8 max-w-2xl">
          <BoardForm
            onSave={handleCreateBoard}
            onCancel={() => setIsCreating(false)}
          />
        </div>
      ) : null}

      {boards.length === 0 ? (
        <div className="border-border bg-surface rounded-lg border px-6 py-12 text-center">
          <h2 className="text-foreground text-xl font-semibold tracking-tight">
            Start with a Board of your own
          </h2>
          <p className="text-muted-foreground mx-auto mt-3 max-w-md text-sm leading-6">
            Give a collection a name, then save Pins to it whenever you want to
            keep an idea close.
          </p>
          {!isCreating ? (
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className="bg-accent text-accent-foreground hover:bg-accent-hover mt-6 inline-flex min-h-11 items-center justify-center rounded-md px-5 text-sm font-semibold transition-colors motion-reduce:transition-none"
            >
              Create your first Board
            </button>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {boards.map((board) => (
            <article
              key={board.id}
              className="border-border bg-surface group hover:border-accent rounded-lg border p-5 transition-colors sm:p-6"
            >
              <p className="text-accent text-xs font-semibold tracking-[0.14em] uppercase">
                Board
              </p>
              <h2 className="text-foreground mt-3 text-xl font-semibold tracking-tight">
                <Link
                  href={`/boards/${encodeURIComponent(board.id)}`}
                  className="hover:text-accent-hover rounded-sm"
                >
                  {board.name}
                </Link>
              </h2>
              {board.description ? (
                <p className="text-muted-foreground mt-2 line-clamp-3 text-sm leading-6">
                  {board.description}
                </p>
              ) : (
                <p className="text-muted-foreground mt-2 text-sm leading-6">
                  A collection waiting for its first saved Pin.
                </p>
              )}
              <Link
                href={`/boards/${encodeURIComponent(board.id)}`}
                className="text-accent hover:text-accent-hover mt-5 inline-flex min-h-11 items-center rounded-sm text-sm font-semibold underline underline-offset-4"
              >
                Open Board
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

interface BoardDetailPageProps {
  boardId: string;
}

export function BoardDetailPage({ boardId }: BoardDetailPageProps) {
  const router = useRouter();
  const [board, setBoard] = useState<Board | null>(null);
  const [pins, setPins] = useState<Pin[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [removingPinId, setRemovingPinId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadBoard() {
      try {
        const ownedBoards = await getMyBoards(controller.signal);
        if (!ownedBoards.some((item) => item.id === boardId)) {
          setAccessDenied(true);
          return;
        }

        const [boardDetails, savedPins] = await Promise.all([
          getBoard(boardId, controller.signal),
          getBoardPins(boardId, controller.signal),
        ]);

        setBoard(boardDetails);
        setPins(savedPins);
        setError(null);
        setAccessDenied(false);
      } catch (cause) {
        if (!controller.signal.aborted) {
          console.error("Unable to load the selected Board.", cause);
          setError(getErrorMessage(cause));
        }
      }
    }

    void loadBoard();
    return () => controller.abort();
  }, [boardId, retryCount]);

  async function handleUpdateBoard(input: BoardInput) {
    const updated = await updateBoard(boardId, input);
    setBoard(updated);
    setIsEditing(false);
    setActionError(null);
  }

  async function handleDeleteBoard() {
    setIsDeleting(true);
    setActionError(null);

    try {
      await deleteBoard(boardId);
      router.replace("/boards");
      router.refresh();
    } catch (cause) {
      console.error("Unable to delete the Board.", cause);
      setActionError(getErrorMessage(cause));
      setIsDeleting(false);
    }
  }

  async function handleRemovePin(pinId: string) {
    setRemovingPinId(pinId);
    setActionError(null);

    try {
      await removePinFromBoard(boardId, pinId);
      setPins((current) => current?.filter((pin) => pin.id !== pinId) ?? []);
    } catch (cause) {
      console.error("Unable to remove the Pin from the Board.", cause);
      setActionError(getErrorMessage(cause));
    } finally {
      setRemovingPinId(null);
    }
  }

  if (accessDenied) {
    return (
      <section className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="border-border bg-surface rounded-lg border px-6 py-12 text-center">
          <h1 className="text-foreground text-xl font-semibold tracking-tight">
            This Board isn’t in your collections
          </h1>
          <p className="text-muted-foreground mt-3 text-sm leading-6">
            Only your own Boards are available here.
          </p>
          <Link
            href="/boards"
            className="text-accent hover:text-accent-hover mt-5 inline-flex min-h-11 items-center rounded-sm text-sm font-semibold underline underline-offset-4"
          >
            Return to your Boards
          </Link>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
        <ErrorState
          title="This Board could not be loaded"
          description={error}
          onRetry={() => {
            setBoard(null);
            setPins(null);
            setError(null);
            setRetryCount((current) => current + 1);
          }}
        />
      </section>
    );
  }

  if (!board || !pins) {
    return <LoadingState label="Loading Board…" />;
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
      <Link
        href="/boards"
        className="text-muted-foreground hover:text-foreground mb-6 inline-flex min-h-11 items-center rounded-sm text-sm font-medium transition-colors motion-reduce:transition-none"
      >
        <span aria-hidden="true" className="mr-2">
          ←
        </span>
        All Boards
      </Link>

      <header className="border-border bg-surface mb-8 rounded-lg border px-6 py-7 sm:px-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0 flex-1">
            <p className="text-accent text-xs font-semibold tracking-[0.16em] uppercase">
              Pincrest / Board
            </p>
            <h1 className="text-foreground mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              {board.name}
            </h1>
            {board.description ? (
              <p className="text-muted-foreground mt-3 max-w-2xl text-sm leading-6 whitespace-pre-wrap sm:text-base">
                {board.description}
              </p>
            ) : null}
          </div>
          {!isEditing && !isConfirmingDelete ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="border-border bg-surface hover:bg-surface-muted inline-flex min-h-11 items-center rounded-md border px-4 text-sm font-semibold transition-colors motion-reduce:transition-none"
              >
                Edit Board
              </button>
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(true)}
                className="text-danger border-danger/30 hover:bg-danger/5 inline-flex min-h-11 items-center rounded-md border px-4 text-sm font-semibold transition-colors motion-reduce:transition-none"
              >
                Delete Board
              </button>
            </div>
          ) : null}
        </div>

        {isEditing ? (
          <div className="mt-7 max-w-2xl">
            <BoardForm
              board={board}
              onSave={handleUpdateBoard}
              onCancel={() => setIsEditing(false)}
            />
          </div>
        ) : null}

        {isConfirmingDelete ? (
          <div className="border-danger/30 bg-danger/5 mt-6 rounded-md border px-4 py-4 sm:flex sm:items-center sm:justify-between sm:gap-4">
            <div>
              <p className="text-foreground font-semibold">
                Delete this Board?
              </p>
              <p className="text-muted-foreground mt-1 text-sm leading-6">
                This Board will be deleted. This action cannot be undone.
              </p>
            </div>
            <div className="mt-4 flex shrink-0 flex-wrap gap-2 sm:mt-0">
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(false)}
                disabled={isDeleting}
                className="border-border bg-surface inline-flex min-h-11 items-center rounded-md border px-4 text-sm font-semibold disabled:opacity-60"
              >
                Keep Board
              </button>
              <button
                type="button"
                onClick={() => void handleDeleteBoard()}
                disabled={isDeleting}
                aria-busy={isDeleting}
                className="bg-danger text-accent-foreground inline-flex min-h-11 items-center rounded-md px-4 text-sm font-semibold disabled:cursor-wait disabled:opacity-60"
              >
                {isDeleting ? "Deleting…" : "Delete Board"}
              </button>
            </div>
          </div>
        ) : null}
      </header>

      {actionError ? (
        <p
          role="alert"
          className="border-danger/30 bg-danger/5 text-danger mb-6 rounded-md border px-4 py-3 text-sm leading-6"
        >
          {actionError}
        </p>
      ) : null}

      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-accent text-xs font-semibold tracking-[0.14em] uppercase">
            Saved collection
          </p>
          <h2 className="text-foreground mt-2 text-2xl font-semibold tracking-tight">
            Pins on this Board
          </h2>
        </div>
        <Link
          href="/pins"
          className="text-accent hover:text-accent-hover inline-flex min-h-11 items-center rounded-sm text-sm font-semibold underline underline-offset-4"
        >
          Browse your Pins
        </Link>
      </div>

      {pins.length === 0 ? (
        <div className="border-border bg-surface rounded-lg border px-6 py-12 text-center">
          <h2 className="text-foreground text-xl font-semibold tracking-tight">
            Nothing saved here yet
          </h2>
          <p className="text-muted-foreground mx-auto mt-3 max-w-md text-sm leading-6">
            Browse your Pins and save one to start building this collection.
          </p>
          <Link
            href="/pins"
            className="bg-accent text-accent-foreground hover:bg-accent-hover mt-6 inline-flex min-h-11 items-center justify-center rounded-md px-5 text-sm font-semibold transition-colors motion-reduce:transition-none"
          >
            Browse Pins
          </Link>
        </div>
      ) : (
        <div className="columns-2 gap-4 sm:columns-3 sm:gap-5 lg:columns-4">
          {pins.map((pin) => (
            <PinCard
              key={pin.id}
              pin={pin}
              action={
                <button
                  type="button"
                  onClick={() => void handleRemovePin(pin.id)}
                  disabled={removingPinId !== null}
                  aria-label={`Remove ${pin.title} from ${board.name}`}
                  className="border-border bg-surface text-foreground hover:bg-surface-muted inline-flex min-h-11 items-center justify-center rounded-md border px-3 text-sm font-semibold shadow-sm transition-colors disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none"
                >
                  {removingPinId === pin.id ? "Removing…" : "Remove"}
                </button>
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}
