"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getMyBoards, savePinToBoard, type Board } from "@/services/boards";
import type { Pin } from "@/services/pins";

interface SavePinDialogProps {
  pin: Pick<Pin, "id" | "title">;
  onClose: () => void;
  onSaved: (board: Board) => void;
}

export function SavePinDialog({ pin, onClose, onSaved }: SavePinDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedBoardName, setSavedBoardName] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }

    return () => {
      if (dialog?.open) {
        dialog.close();
      }
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    void getMyBoards(controller.signal)
      .then((loadedBoards) => {
        setBoards(loadedBoards);
        setSelectedBoardId(
          loadedBoards.length > 0 ? String(loadedBoards[0].id) : null,
        );
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setLoadError(
            cause instanceof Error
              ? cause.message
              : "Your Boards could not be loaded. Try again.",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, []);

  async function handleSave() {
    const selectedBoard = boards.find(
      (board) => String(board.id) === selectedBoardId,
    );
    if (!selectedBoard) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      await savePinToBoard(selectedBoard.id, pin.id);
      setSavedBoardName(selectedBoard.name);
      onSaved(selectedBoard);
    } catch (cause) {
      setSaveError(
        cause instanceof Error
          ? cause.message
          : "This Pin could not be saved. Try again.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="save-pin-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!isSaving) {
          onClose();
        }
      }}
      onClose={onClose}
      className="bg-surface text-foreground border-border backdrop:bg-foreground/40 m-auto max-h-[min(92dvh,44rem)] w-[min(100%-2rem,34rem)] overflow-y-auto rounded-xl border p-0 shadow-2xl"
    >
      <header className="border-border flex items-start justify-between gap-6 border-b px-6 py-5 sm:px-8">
        <div>
          <p className="text-accent text-xs font-semibold tracking-[0.16em] uppercase">
            Save this Pin
          </p>
          <h2
            id="save-pin-title"
            className="mt-2 text-2xl font-semibold tracking-tight"
          >
            Choose a Board
          </h2>
          <p className="text-muted-foreground mt-2 text-sm leading-6">
            Add “{pin.title}” to one of your Boards.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={isSaving}
          className="border-border text-muted-foreground hover:bg-surface-muted inline-flex min-h-11 shrink-0 items-center rounded-md border px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
        >
          Close
        </button>
      </header>

      <div className="px-6 py-6 sm:px-8">
        {savedBoardName ? (
          <div className="border-border bg-surface-muted rounded-lg border p-5">
            <p role="status" className="text-accent font-semibold">
              Pin saved to {savedBoardName}.
            </p>
            <Link
              href={`/boards/${encodeURIComponent(
                String(
                  boards.find((board) => board.name === savedBoardName)?.id ??
                    "",
                ),
              )}`}
              onClick={onClose}
              className="text-accent hover:text-accent-hover mt-3 inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4"
            >
              View Board
            </Link>
          </div>
        ) : isLoading ? (
          <div
            className="text-muted-foreground flex min-h-36 items-center justify-center gap-3 text-sm"
            role="status"
          >
            <span
              aria-hidden="true"
              className="border-border border-t-accent size-5 animate-spin rounded-full border-2 motion-reduce:animate-none"
            />
            Loading your Boards…
          </div>
        ) : loadError ? (
          <div className="bg-danger/5 rounded-md p-4">
            <p role="alert" className="text-danger text-sm leading-6">
              {loadError}
            </p>
            <button
              type="button"
              onClick={() => {
                setIsLoading(true);
                setLoadError(null);
                void getMyBoards()
                  .then((loadedBoards) => {
                    setBoards(loadedBoards);
                    setSelectedBoardId(
                      loadedBoards.length > 0
                        ? String(loadedBoards[0].id)
                        : null,
                    );
                  })
                  .catch((cause: unknown) => {
                    setLoadError(
                      cause instanceof Error
                        ? cause.message
                        : "Your Boards could not be loaded. Try again.",
                    );
                  })
                  .finally(() => setIsLoading(false));
              }}
              className="text-accent hover:text-accent-hover mt-3 inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4"
            >
              Try again
            </button>
          </div>
        ) : boards.length === 0 ? (
          <div className="border-border rounded-lg border px-5 py-7 text-center">
            <h3 className="text-foreground font-semibold">
              Create a Board first
            </h3>
            <p className="text-muted-foreground mt-2 text-sm leading-6">
              Boards keep the Pins you want to find again together.
            </p>
            <Link
              href="/boards"
              onClick={onClose}
              className="bg-accent text-accent-foreground hover:bg-accent-hover mt-5 inline-flex min-h-11 items-center justify-center rounded-md px-5 text-sm font-semibold transition-colors motion-reduce:transition-none"
            >
              Create a Board
            </Link>
          </div>
        ) : (
          <>
            <div
              className="max-h-72 space-y-2 overflow-y-auto"
              role="radiogroup"
              aria-label="Your Boards"
            >
              {boards.map((board) => {
                const isSelected = String(board.id) === selectedBoardId;
                return (
                  <button
                    key={board.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => {
                      setSelectedBoardId(String(board.id));
                      setSaveError(null);
                    }}
                    className={`border-border flex min-h-16 w-full items-center justify-between gap-4 rounded-lg border px-4 py-3 text-left transition-colors motion-reduce:transition-none ${
                      isSelected
                        ? "border-accent bg-surface-muted"
                        : "bg-surface hover:bg-surface-muted"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="text-foreground block truncate font-semibold">
                        {board.name}
                      </span>
                      {board.description ? (
                        <span className="text-muted-foreground mt-1 line-clamp-2 block text-sm leading-5">
                          {board.description}
                        </span>
                      ) : null}
                    </span>
                    <span
                      aria-hidden="true"
                      className={`border-accent grid size-5 shrink-0 place-items-center rounded-full border ${
                        isSelected ? "bg-accent" : "bg-surface"
                      }`}
                    >
                      {isSelected ? (
                        <span className="size-2 rounded-full bg-white" />
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>
            {saveError ? (
              <p role="alert" className="text-danger mt-4 text-sm leading-6">
                {saveError}
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={isSaving || !selectedBoardId}
              className="bg-accent text-accent-foreground hover:bg-accent-hover mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-md px-5 text-sm font-semibold transition-colors disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none"
            >
              {isSaving ? "Saving Pin…" : "Save to Board"}
            </button>
          </>
        )}
      </div>
    </dialog>
  );
}
