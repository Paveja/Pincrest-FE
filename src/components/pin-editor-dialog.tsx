"use client";

import Image from "next/image";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { ApiError } from "@/services/api-client";
import { uploadPinImage, type Pin, type PinInput } from "@/services/pins";

interface PinEditorDialogProps {
  pin: Pin | null;
  onClose: () => void;
  onSave: (input: PinInput) => Promise<void>;
}

type PinField = "title" | "description" | "destinationUrl";
type FieldErrors = Partial<Record<PinField | "image", string>>;

export function PinEditorDialog({
  pin,
  onClose,
  onSave,
}: PinEditorDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previewRef = useRef<string | null>(null);
  const [title, setTitle] = useState(pin?.title ?? "");
  const [description, setDescription] = useState(pin?.description ?? "");
  const [destinationUrl, setDestinationUrl] = useState(
    pin?.destinationUrl ?? "",
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    pin?.imageUrl ?? null,
  );
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }

    return () => {
      if (dialog?.open) {
        dialog.close();
      }
      if (previewRef.current) {
        URL.revokeObjectURL(previewRef.current);
      }
    };
  }, []);

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0] ?? null;
    setImageFile(file);
    setUploadedImageUrl(null);
    setUploadProgress(null);
    setFieldErrors((current) => ({ ...current, image: undefined }));

    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
      previewRef.current = null;
    }

    if (file) {
      const localUrl = URL.createObjectURL(file);
      previewRef.current = localUrl;
      setPreviewUrl(localUrl);
    } else {
      setPreviewUrl(pin?.imageUrl ?? null);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const nextErrors: FieldErrors = {};
    const cleanTitle = title.trim();
    const cleanDestination = destinationUrl.trim();

    if (!cleanTitle) {
      nextErrors.title = "Add a title for this Pin.";
    }

    if (!pin && !imageFile) {
      nextErrors.image = "Choose an image to create a Pin.";
    }

    if (cleanDestination) {
      try {
        const parsedUrl = new URL(cleanDestination);
        if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
          nextErrors.destinationUrl = "Use a valid http or https link.";
        }
      } catch {
        nextErrors.destinationUrl = "Enter a complete destination URL.";
      }
    }

    if (imageFile && !imageFile.type.startsWith("image/")) {
      nextErrors.image = "Choose a valid image file.";
    }

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSaving(true);

    try {
      let imageUrl = pin?.imageUrl ?? "";

      if (imageFile) {
        if (!uploadedImageUrl) {
          setUploadProgress(0);
          const uploadedUrl = await uploadPinImage(
            imageFile,
            setUploadProgress,
          );
          setUploadedImageUrl(uploadedUrl);
          imageUrl = uploadedUrl;
        } else {
          imageUrl = uploadedImageUrl;
        }
      }

      await onSave({
        title: cleanTitle,
        description: description.trim(),
        imageUrl,
        ...(isEditing
          ? { destinationUrl: cleanDestination || null }
          : cleanDestination
            ? { destinationUrl: cleanDestination }
            : {}),
      });
    } catch (cause) {
      if (cause instanceof ApiError) {
        const backendErrors = cause.fieldErrors as FieldErrors;
        setFieldErrors(backendErrors);
        setFormError(
          Object.keys(backendErrors).length > 0
            ? null
            : cause.message || "The Pin could not be saved. Try again.",
        );
      } else {
        setFormError(
          cause instanceof Error
            ? cause.message
            : "The Pin could not be saved. Try again.",
        );
      }
    } finally {
      setIsSaving(false);
    }
  }

  const isEditing = pin !== null;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="pin-dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!isSaving) {
          onClose();
        }
      }}
      onClose={onClose}
      className="bg-surface text-foreground border-border backdrop:bg-foreground/40 m-auto max-h-[min(92dvh,52rem)] w-[min(100%-2rem,46rem)] overflow-y-auto rounded-xl border p-0 shadow-2xl"
    >
      <form onSubmit={(event) => void handleSubmit(event)} noValidate>
        <header className="border-border flex items-start justify-between gap-6 border-b px-6 py-5 sm:px-8">
          <div>
            <p className="text-accent text-xs font-semibold tracking-[0.16em] uppercase">
              {isEditing ? "Your collection" : "Add to your collection"}
            </p>
            <h2
              id="pin-dialog-title"
              className="mt-2 text-2xl font-semibold tracking-tight"
            >
              {isEditing ? "Edit Pin" : "Create a Pin"}
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

        <div className="grid gap-6 px-6 py-6 sm:px-8 md:grid-cols-[minmax(0,1fr)_minmax(15rem,0.85fr)]">
          <div className="space-y-5">
            <div>
              <label htmlFor="pin-title" className="text-sm font-semibold">
                Title <span aria-hidden="true">*</span>
              </label>
              <input
                id="pin-title"
                name="title"
                value={title}
                onChange={(event) => setTitle(event.currentTarget.value)}
                aria-invalid={Boolean(fieldErrors.title)}
                aria-describedby={
                  fieldErrors.title ? "pin-title-error" : undefined
                }
                autoFocus
                className="border-border bg-surface text-foreground placeholder:text-muted-foreground focus:border-accent focus-visible:ring-accent/30 mt-2 min-h-12 w-full rounded-md border px-4 py-3 text-base transition-colors outline-none focus-visible:ring-2"
              />
              {fieldErrors.title ? (
                <p
                  id="pin-title-error"
                  className="text-danger mt-2 text-sm"
                  role="alert"
                >
                  {fieldErrors.title}
                </p>
              ) : null}
            </div>

            <div>
              <label
                htmlFor="pin-description"
                className="text-sm font-semibold"
              >
                Description
              </label>
              <textarea
                id="pin-description"
                name="description"
                value={description}
                onChange={(event) => setDescription(event.currentTarget.value)}
                rows={5}
                className="border-border bg-surface text-foreground placeholder:text-muted-foreground focus:border-accent focus-visible:ring-accent/30 mt-2 w-full resize-y rounded-md border px-4 py-3 text-base leading-6 transition-colors outline-none focus-visible:ring-2"
              />
            </div>

            <div>
              <label
                htmlFor="pin-destination"
                className="text-sm font-semibold"
              >
                Destination URL{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </label>
              <input
                id="pin-destination"
                name="destinationUrl"
                type="url"
                inputMode="url"
                value={destinationUrl}
                onChange={(event) =>
                  setDestinationUrl(event.currentTarget.value)
                }
                aria-invalid={Boolean(fieldErrors.destinationUrl)}
                aria-describedby={
                  fieldErrors.destinationUrl
                    ? "pin-destination-error"
                    : undefined
                }
                placeholder="https://example.com"
                className="border-border bg-surface text-foreground placeholder:text-muted-foreground focus:border-accent focus-visible:ring-accent/30 mt-2 min-h-12 w-full rounded-md border px-4 py-3 text-base transition-colors outline-none focus-visible:ring-2"
              />
              {fieldErrors.destinationUrl ? (
                <p
                  id="pin-destination-error"
                  className="text-danger mt-2 text-sm"
                  role="alert"
                >
                  {fieldErrors.destinationUrl}
                </p>
              ) : null}
            </div>
          </div>

          <div>
            <label htmlFor="pin-image" className="text-sm font-semibold">
              Image <span aria-hidden="true">{isEditing ? "" : "*"}</span>
            </label>
            <label
              htmlFor="pin-image"
              className="border-border bg-surface-muted hover:border-accent focus-within:ring-accent mt-2 flex min-h-64 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed p-4 text-center transition-colors focus-within:ring-2 focus-within:ring-offset-2"
            >
              {previewUrl ? (
                <span className="relative block aspect-[4/5] w-full overflow-hidden rounded-md">
                  <Image
                    src={previewUrl}
                    alt={imageFile?.name ?? pin?.title ?? "Pin image preview"}
                    fill
                    sizes="(max-width: 768px) 80vw, 320px"
                    unoptimized
                    className="object-cover"
                  />
                </span>
              ) : (
                <span className="text-muted-foreground px-3 py-6">
                  <span className="text-foreground block text-sm font-semibold">
                    Choose an image
                  </span>
                  <span className="mt-2 block text-sm leading-6">
                    Select an image from your device to preview it here.
                  </span>
                </span>
              )}
              <span className="text-accent mt-3 text-sm font-semibold">
                {imageFile
                  ? "Choose a different image"
                  : isEditing
                    ? "Replace image"
                    : "Select image"}
              </span>
              <input
                id="pin-image"
                name="image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                aria-invalid={Boolean(fieldErrors.image)}
                aria-describedby={
                  fieldErrors.image ? "pin-image-error" : "pin-image-help"
                }
                className="sr-only"
              />
            </label>
            <p
              id="pin-image-help"
              className="text-muted-foreground mt-2 text-xs leading-5"
            >
              {isEditing
                ? "Keep the current image or choose a replacement."
                : "An image is required to create a Pin."}
            </p>
            {fieldErrors.image ? (
              <p
                id="pin-image-error"
                className="text-danger mt-2 text-sm"
                role="alert"
              >
                {fieldErrors.image}
              </p>
            ) : null}
            {uploadProgress !== null ? (
              <div className="mt-4">
                <div className="text-muted-foreground flex justify-between gap-3 text-sm">
                  <span>
                    {uploadProgress < 100
                      ? "Uploading image"
                      : "Image uploaded"}
                  </span>
                  <span>{uploadProgress}%</span>
                </div>
                <progress
                  aria-label="Image upload progress"
                  max="100"
                  value={uploadProgress}
                  className="accent-accent mt-2 h-2 w-full"
                />
              </div>
            ) : null}
          </div>

          {formError ? (
            <p
              role="alert"
              className="text-danger bg-danger/5 rounded-md p-3 text-sm leading-6 md:col-span-2"
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
            className="bg-accent text-accent-foreground hover:bg-accent-hover active:bg-accent-hover inline-flex min-h-11 items-center justify-center rounded-md px-5 text-sm font-semibold transition-colors disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none"
          >
            {isSaving
              ? uploadProgress !== null && uploadProgress < 100
                ? "Uploading…"
                : isEditing
                  ? "Saving…"
                  : "Creating…"
              : isEditing
                ? "Save changes"
                : "Create Pin"}
          </button>
        </footer>
      </form>
    </dialog>
  );
}
