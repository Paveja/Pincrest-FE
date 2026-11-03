"use client";

import { useState, type FormEvent } from "react";
import type { Board } from "@/services/content";
import type { BoardInput } from "@/services/boards";

interface BoardFormProps {
  board?: Board;
  onSave: (input: BoardInput) => Promise<void>;
  onCancel: () => void;
}

export function BoardForm({ board, onSave, onCancel }: BoardFormProps) {
  const [name, setName] = useState(board?.name ?? "");
  const [description, setDescription] = useState(board?.description ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Enter a name for this Board.");
      return;
    }

    setIsSaving(true);

    try {
      await onSave({
        name: trimmedName,
        description: description.trim(),
      });
    } catch (cause) {
      console.error("Unable to save the Board.", cause);
      setError(
        cause instanceof Error
          ? cause.message
          : "Your Board could not be saved. Try again.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="border-border bg-surface space-y-5 rounded-lg border p-5 sm:p-6"
    >
      <div>
        <label
          htmlFor="board-name"
          className="text-foreground block text-sm font-semibold"
        >
          Board name <span aria-hidden="true">*</span>
        </label>
        <input
          id="board-name"
          name="name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-describedby="board-name-hint"
          className="border-border bg-surface text-foreground focus:border-accent mt-2 min-h-12 w-full rounded-md border px-4 text-base outline-none focus:ring-2 focus:ring-[color:var(--accent)]/20"
        />
        <p id="board-name-hint" className="text-muted-foreground mt-2 text-sm">
          Give this collection a name you’ll recognize.
        </p>
      </div>

      <div>
        <label
          htmlFor="board-description"
          className="text-foreground block text-sm font-semibold"
        >
          Description <span className="text-muted-foreground">(optional)</span>
        </label>
        <textarea
          id="board-description"
          name="description"
          rows={3}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="border-border bg-surface text-foreground focus:border-accent mt-2 w-full resize-y rounded-md border px-4 py-3 text-base leading-6 outline-none focus:ring-2 focus:ring-[color:var(--accent)]/20"
        />
      </div>

      {error ? (
        <p
          className="border-danger/30 bg-danger/5 text-danger rounded-md border px-4 py-3 text-sm leading-6"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isSaving}
          aria-busy={isSaving}
          className="bg-accent text-accent-foreground hover:bg-accent-hover inline-flex min-h-11 items-center justify-center rounded-md px-5 text-sm font-semibold transition-colors disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none"
        >
          {isSaving ? "Saving…" : board ? "Save changes" : "Create Board"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="text-muted-foreground hover:bg-surface-muted inline-flex min-h-11 items-center justify-center rounded-md px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
