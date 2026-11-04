"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { PinEditorDialog } from "@/components/pin-editor-dialog";
import { PinDetailDialog } from "@/components/pins/pin-detail-dialog";
import { SavePinDialog } from "@/components/boards/save-pin-dialog";
import { useAuth } from "@/components/auth-provider";
import type { Board } from "@/services/boards";
import {
  createPin,
  deletePin,
  getMyPins,
  getSafeDestinationUrl,
  updatePin,
  type Pin,
  type PinInput,
} from "@/services/pins";

type EditorState = { mode: "create" } | { mode: "edit"; pin: Pin };

export function PinManagement() {
  const { user } = useAuth();
  const [pins, setPins] = useState<Pin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [deletingPinId, setDeletingPinId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [detailPin, setDetailPin] = useState<Pin | null>(null);
  const [savePin, setSavePin] = useState<Pin | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    void getMyPins(controller.signal)
      .then((loadedPins) => {
        setPins(loadedPins);
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setLoadError(
            cause instanceof Error
              ? cause.message
              : "Your Pins could not be loaded. Try again.",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [refreshToken]);

  async function handleSave(input: PinInput) {
    if (editor?.mode === "edit") {
      const updatedPin = await updatePin(editor.pin.id, input);
      setPins((currentPins) =>
        currentPins.map((pin) => (pin.id === updatedPin.id ? updatedPin : pin)),
      );
      setNotice("Your Pin was updated.");
    } else {
      const createdPin = await createPin(input);
      setPins((currentPins) => [createdPin, ...currentPins]);
      setNotice("Your Pin was created.");
    }

    setActionError(null);
    setEditor(null);
  }

  async function handleDelete(pin: Pin) {
    setIsDeleting(true);
    setActionError(null);
    setNotice(null);

    try {
      await deletePin(pin.id);
      setPins((currentPins) =>
        currentPins.filter((item) => item.id !== pin.id),
      );
      setDeletingPinId(null);
      setNotice("Your Pin was deleted.");
    } catch (cause) {
      setActionError(
        cause instanceof Error
          ? cause.message
          : "The Pin could not be deleted. Try again.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  const displayName =
    typeof user?.name === "string" && user.name.trim()
      ? user.name.trim()
      : typeof user?.username === "string" && user.username.trim()
        ? `@${user.username.trim()}`
        : "Your collection";
  const currentUserId =
    typeof user?.id === "string" || typeof user?.id === "number"
      ? String(user.id)
      : null;

  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <header className="border-border flex flex-col justify-between gap-6 border-b pb-7 sm:flex-row sm:items-end sm:pb-8">
        <div>
          <p className="text-accent mb-3 flex items-center gap-3 text-xs font-semibold tracking-[0.16em] uppercase">
            <span
              aria-hidden="true"
              className="bg-accent h-5 w-1 rounded-full"
            />
            Pincrest / Your profile
          </p>
          <h1 className="text-foreground text-3xl font-semibold tracking-tight sm:text-4xl">
            {displayName === "Your collection"
              ? "Your Pins"
              : `${displayName}’s Pins`}
          </h1>
          <p className="text-muted-foreground mt-3 max-w-xl text-sm leading-6 sm:text-base">
            Keep the places, ideas, and finds you want to come back to.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setNotice(null);
            setActionError(null);
            setEditor({ mode: "create" });
          }}
          className="bg-accent text-accent-foreground hover:bg-accent-hover active:bg-accent-hover inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-md px-5 text-sm font-semibold transition-colors motion-reduce:transition-none"
        >
          <span aria-hidden="true" className="text-xl leading-none">
            +
          </span>
          Create Pin
        </button>
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
          Your collection
        </h2>
        {!isLoading && !loadError ? (
          <p className="text-muted-foreground text-sm">
            {pins.length} {pins.length === 1 ? "Pin" : "Pins"}
          </p>
        ) : null}
      </div>

      {isLoading ? (
        <div
          className="border-border bg-surface mt-5 flex min-h-48 items-center justify-center gap-3 rounded-lg border px-6 text-sm"
          role="status"
        >
          <span
            aria-hidden="true"
            className="border-border border-t-accent size-5 animate-spin rounded-full border-2 motion-reduce:animate-none"
          />
          Loading your Pins…
        </div>
      ) : loadError ? (
        <div className="border-border bg-surface mt-5 rounded-lg border px-6 py-10 text-center">
          <h3 className="text-foreground text-lg font-semibold">
            Your Pins aren’t available
          </h3>
          <p
            role="alert"
            className="text-muted-foreground mx-auto mt-2 max-w-lg text-sm leading-6"
          >
            {loadError}
          </p>
          <button
            type="button"
            onClick={() => {
              setIsLoading(true);
              setLoadError(null);
              setRefreshToken((current) => current + 1);
            }}
            className="border-border text-foreground hover:bg-surface-muted mt-5 inline-flex min-h-11 items-center justify-center rounded-md border px-5 text-sm font-semibold transition-colors motion-reduce:transition-none"
          >
            Try again
          </button>
        </div>
      ) : pins.length === 0 ? (
        <div className="border-border bg-surface mt-5 flex min-h-72 flex-col items-center justify-center rounded-lg border px-6 py-12 text-center">
          <span aria-hidden="true" className="text-accent text-3xl">
            +
          </span>
          <h3 className="text-foreground mt-4 text-xl font-semibold tracking-tight">
            Your collection starts here
          </h3>
          <p className="text-muted-foreground mt-2 max-w-md text-sm leading-6">
            Add an image, a few details, and an optional link to save a Pin to
            your profile.
          </p>
          <button
            type="button"
            onClick={() => setEditor({ mode: "create" })}
            className="bg-accent text-accent-foreground hover:bg-accent-hover mt-6 inline-flex min-h-11 items-center justify-center rounded-md px-5 text-sm font-semibold transition-colors motion-reduce:transition-none"
          >
            Create your first Pin
          </button>
        </div>
      ) : (
        <ul className="mt-5 grid grid-cols-2 items-start gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 lg:gap-6">
          {pins.map((pin, index) => {
            const destinationUrl = getSafeDestinationUrl(pin.destinationUrl);
            const canManagePin =
              currentUserId !== null && currentUserId === String(pin.ownerId);
            const pinId = String(pin.id);

            return (
              <li
                key={pin.id}
                className="border-border bg-surface min-w-0 overflow-hidden rounded-lg border"
              >
                <div
                  className={`relative ${index % 3 === 1 ? "aspect-[4/3]" : index % 3 === 2 ? "aspect-[3/4]" : "aspect-[4/5]"} bg-surface-muted`}
                >
                  <Image
                    src={pin.imageUrl}
                    alt={pin.title}
                    fill
                    sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 260px"
                    unoptimized
                    className="object-cover"
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
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setDetailPin(pin)}
                      className="border-border text-foreground hover:bg-surface-muted inline-flex min-h-11 flex-1 items-center justify-center rounded-md border px-2 text-sm font-semibold transition-colors motion-reduce:transition-none"
                    >
                      View Pin
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNotice(null);
                        setActionError(null);
                        setSavePin(pin);
                      }}
                      className="bg-accent text-accent-foreground hover:bg-accent-hover inline-flex min-h-11 flex-1 items-center justify-center rounded-md px-2 text-sm font-semibold transition-colors motion-reduce:transition-none"
                    >
                      Save
                    </button>
                  </div>
                  {destinationUrl ? (
                    <a
                      href={destinationUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-accent hover:text-accent-hover mt-2 inline-flex min-h-11 text-sm font-medium break-all underline decoration-current/40 underline-offset-2"
                    >
                      Visit destination
                    </a>
                  ) : null}

                  {canManagePin ? (
                    deletingPinId === pinId ? (
                      <div
                        className="border-border mt-4 border-t pt-3"
                        role="group"
                        aria-label={`Confirm deleting ${pin.title}`}
                      >
                        <p className="text-muted-foreground text-sm leading-5">
                          Delete this Pin? This can’t be undone.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setDeletingPinId(null)}
                            disabled={isDeleting}
                            className="border-border text-foreground hover:bg-surface-muted inline-flex min-h-11 items-center justify-center rounded-md border px-3 text-sm font-medium disabled:opacity-60"
                          >
                            Keep Pin
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(pin)}
                            disabled={isDeleting}
                            className="bg-danger inline-flex min-h-11 items-center justify-center rounded-md px-3 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
                          >
                            {isDeleting ? "Deleting…" : "Delete"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="border-border mt-4 flex gap-2 border-t pt-3">
                        <button
                          type="button"
                          onClick={() => {
                            setNotice(null);
                            setActionError(null);
                            setEditor({ mode: "edit", pin });
                          }}
                          className="border-border text-foreground hover:bg-surface-muted inline-flex min-h-11 flex-1 items-center justify-center rounded-md border px-3 text-sm font-semibold transition-colors motion-reduce:transition-none"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingPinId(pinId)}
                          className="text-danger hover:bg-danger/5 inline-flex min-h-11 flex-1 items-center justify-center rounded-md px-3 text-sm font-semibold transition-colors motion-reduce:transition-none"
                        >
                          Delete
                        </button>
                      </div>
                    )
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {editor ? (
        <PinEditorDialog
          key={editor.mode === "edit" ? String(editor.pin.id) : "create-pin"}
          pin={editor.mode === "edit" ? editor.pin : null}
          onClose={() => setEditor(null)}
          onSave={handleSave}
        />
      ) : null}
      {detailPin ? (
        <PinDetailDialog
          pin={detailPin}
          onClose={() => setDetailPin(null)}
          onSave={() => {
            setDetailPin(null);
            setSavePin(detailPin);
          }}
        />
      ) : null}
      {savePin ? (
        <SavePinDialog
          pin={savePin}
          onClose={() => setSavePin(null)}
          onSaved={(board: Board) => {
            setNotice(`Saved to ${board.name}.`);
            setActionError(null);
          }}
        />
      ) : null}
    </section>
  );
}
