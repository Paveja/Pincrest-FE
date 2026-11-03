"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { savePinToBoard, getMyBoards } from "@/services/boards";
import type { Board } from "@/services/content";

interface SavePinButtonProps {
  pinId: string;
  pinTitle: string;
}

export function SavePinButton({ pinId, pinTitle }: SavePinButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoadingBoards, setIsLoadingBoards] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savingBoardId, setSavingBoardId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const requestRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (isOpen && dialog && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog?.open) {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    return () => requestRef.current?.abort();
  }, []);

  async function loadBoards() {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setIsLoadingBoards(true);
    setError(null);
    setSuccess(null);

    try {
      setBoards(await getMyBoards(controller.signal));
    } catch (cause) {
      if (!controller.signal.aborted) {
        console.error("Unable to load Boards for saving a Pin.", cause);
        setError(
          cause instanceof Error
            ? cause.message
            : "Your Boards could not be loaded. Try again.",
        );
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsLoadingBoards(false);
      }
    }
  }

  async function openBoardPicker() {
    setIsOpen(true);
    await loadBoards();
  }

  function closeDialog() {
    if (isSaving) {
      return;
    }

    requestRef.current?.abort();
    setIsOpen(false);
    setSavingBoardId(null);
  }

  async function handleSave(board: Board) {
    setIsSaving(true);
    setSavingBoardId(board.id);
    setError(null);
    setSuccess(null);

    try {
      await savePinToBoard(board.id, pinId);
      setSuccess(`Saved “${pinTitle}” to ${board.name}.`);
    } catch (cause) {
      console.error("Unable to save a Pin to a Board.", cause);
      setError(
        cause instanceof Error
          ? cause.message
          : "This Pin could not be saved. Try again.",
      );
    } finally {
      setIsSaving(false);
      setSavingBoardId(null);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => void openBoardPicker()}
        className="bg-accent text-accent-foreground hover:bg-accent-hover focus-visible:outline-accent inline-flex min-h-11 items-center justify-center rounded-md px-4 text-sm font-semibold shadow-sm transition-colors motion-reduce:transition-none"
        aria-label={`Save ${pinTitle} to a Board`}
      >
        Save
      </button>

      {isOpen ? (
        <dialog
          ref={dialogRef}
          aria-labelledby="save-pin-title"
          onCancel={(event) => {
            event.preventDefault();
            closeDialog();
          }}
          onClose={() => setIsOpen(false)}
          className="border-border bg-surface text-foreground backdrop:bg-foreground/40 m-auto w-[min(28rem,calc(100%-2rem))] rounded-lg border p-0 shadow-xl"
        >
          <div className="flex items-start justify-between gap-4 border-b border-[color:var(--border)] px-6 py-5">
            <div>
              <p className="text-accent text-xs font-semibold tracking-[0.14em] uppercase">
                Save Pin
              </p>
              <h2
                id="save-pin-title"
                className="mt-2 text-xl font-semibold tracking-tight"
              >
                Choose a Board
              </h2>
              <p className="text-muted-foreground mt-2 text-sm leading-6">
                Save “{pinTitle}” to one of your collections.
              </p>
            </div>
            <button
              type="button"
              onClick={closeDialog}
              disabled={isSaving}
              className="text-muted-foreground hover:bg-surface-muted inline-flex min-h-11 min-w-11 items-center justify-center rounded-md px-3 transition-colors disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none"
              aria-label="Close Board picker"
            >
              Close
            </button>
          </div>

          <div className="space-y-4 px-6 py-5">
            {isLoadingBoards ? (
              <p role="status" className="text-muted-foreground py-5 text-sm">
                Loading your Boards…
              </p>
            ) : null}

            {error ? (
              <div className="border-danger/30 bg-danger/5 rounded-md border px-4 py-3">
                <p className="text-danger text-sm leading-6" role="alert">
                  {error}
                </p>
                <button
                  type="button"
                  onClick={() => void loadBoards()}
                  className="text-accent hover:text-accent-hover mt-2 min-h-11 rounded-sm text-sm font-semibold underline underline-offset-4"
                >
                  Try loading Boards again
                </button>
              </div>
            ) : null}

            {success ? (
              <p
                role="status"
                aria-live="polite"
                className="border-accent/30 bg-accent/5 rounded-md border px-4 py-3 text-sm leading-6"
              >
                {success}
              </p>
            ) : null}

            {!isLoadingBoards && !error && boards.length === 0 ? (
              <div className="border-border bg-background rounded-md border px-4 py-5">
                <p className="font-semibold">No Boards yet</p>
                <p className="text-muted-foreground mt-1 text-sm leading-6">
                  Create a Board first, then come back to save this Pin.
                </p>
                <Link
                  href="/boards"
                  onClick={closeDialog}
                  className="text-accent hover:text-accent-hover mt-3 inline-flex min-h-11 items-center rounded-sm text-sm font-semibold underline underline-offset-4"
                >
                  Go to Boards
                </Link>
              </div>
            ) : null}

            {!isLoadingBoards && !error && boards.length > 0 ? (
              <ul className="max-h-72 space-y-2 overflow-y-auto">
                {boards.map((board) => (
                  <li key={board.id}>
                    <button
                      type="button"
                      onClick={() => void handleSave(board)}
                      disabled={isSaving}
                      className="border-border hover:border-accent hover:bg-surface-muted focus-visible:outline-accent flex min-h-12 w-full items-center justify-between gap-3 rounded-md border px-4 py-3 text-left transition-colors disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none"
                    >
                      <span className="min-w-0">
                        <span className="block font-medium">{board.name}</span>
                        {board.description ? (
                          <span className="text-muted-foreground mt-1 block text-sm leading-5">
                            {board.description}
                          </span>
                        ) : null}
                      </span>
                      <span className="text-accent shrink-0 text-sm font-semibold">
                        {savingBoardId === board.id ? "Saving…" : "Save here"}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </dialog>
      ) : null}
    </>
  );
}
