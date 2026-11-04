"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Board, BoardInput } from "@/services/boards";

interface BoardEditorDialogProps {
  board: Board | null;
  onClose: () => void;
  onSave: (input: BoardInput) => Promise<void>;
}

export function BoardEditorDialog({
  board,
  onClose,
  onSave,
}: BoardEditorDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState(board?.name ?? "");
  const [description, setDescription] = useState(board?.description ?? "");
  const [nameError, setNameError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const isEditing = board !== null;

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const cleanName = name.trim();
    if (!cleanName) {
      setNameError("Add a name for this Board.");
      return;
    }

    setNameError(null);
    setIsSaving(true);

    try {
      await onSave({ name: cleanName, description: description.trim() });
    } catch (cause) {
      setFormError(
        cause instanceof Error
          ? cause.message
          : "The Board could not be saved. Try again.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="board-editor-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!isSaving) {
          onClose();
        }
      }}
      onClose={onClose}
      className="bg-surface text-foreground border-border backdrop:bg-foreground/40 m-auto max-h-[min(92dvh,44rem)] w-[min(100%-2rem,34rem)] overflow-y-auto rounded-xl border p-0 shadow-2xl"
    >
      <form onSubmit={(event) => void handleSubmit(event)} noValidate>
        <header className="border-border flex items-start justify-between gap-6 border-b px-6 py-5 sm:px-8">
          <div>
            <p className="text-accent text-xs font-semibold tracking-[0.16em] uppercase">
              Your collections
            </p>
            <h2
              id="board-editor-title"
              className="mt-2 text-2xl font-semibold tracking-tight"
            >
              {isEditing ? "Edit Board" : "Create a Board"}
            </h2>
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

        <div className="space-y-5 px-6 py-6 sm:px-8">
          <div>
            <label htmlFor="board-name" className="text-sm font-semibold">
              Board name <span aria-hidden="true">*</span>
            </label>
            <input
              id="board-name"
              name="name"
              autoFocus
              value={name}
              onChange={(event) => {
                setName(event.currentTarget.value);
                if (nameError) {
                  setNameError(null);
                }
              }}
              aria-invalid={Boolean(nameError)}
              aria-describedby={nameError ? "board-name-error" : undefined}
              className="border-border bg-surface text-foreground placeholder:text-muted-foreground focus:border-accent focus-visible:ring-accent/30 mt-2 min-h-12 w-full rounded-md border px-4 py-3 text-base transition-colors outline-none focus-visible:ring-2"
            />
            {nameError ? (
              <p
                id="board-name-error"
                role="alert"
                className="text-danger mt-2 text-sm"
              >
                {nameError}
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="board-description"
              className="text-sm font-semibold"
            >
              Description{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </label>
            <textarea
              id="board-description"
              name="description"
              rows={4}
              value={description}
              onChange={(event) => setDescription(event.currentTarget.value)}
              className="border-border bg-surface text-foreground placeholder:text-muted-foreground focus:border-accent focus-visible:ring-accent/30 mt-2 w-full resize-y rounded-md border px-4 py-3 text-base leading-6 transition-colors outline-none focus-visible:ring-2"
            />
          </div>

          {formError ? (
            <p
              role="alert"
              className="text-danger bg-danger/5 rounded-md p-3 text-sm leading-6"
            >
              {formError}
            </p>
          ) : null}
        </div>

        <footer className="border-border flex flex-col-reverse gap-3 border-t px-6 py-5 sm:flex-row sm:justify-end sm:px-8">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="text-muted-foreground hover:bg-surface-muted inline-flex min-h-11 items-center justify-center rounded-md px-5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="bg-accent text-accent-foreground hover:bg-accent-hover inline-flex min-h-11 items-center justify-center rounded-md px-5 text-sm font-semibold transition-colors disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none"
          >
            {isSaving ? "Saving…" : isEditing ? "Save changes" : "Create Board"}
          </button>
        </footer>
      </form>
    </dialog>
  );
}
