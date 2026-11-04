"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth-provider";
import { ApiError } from "@/services/api-client";
import {
  createPinComment,
  deletePinComment,
  getPinComments,
  updatePinComment,
  type PinComment,
  type PinCommentPage,
} from "@/services/comments";
import { getSafeDestinationUrl } from "@/services/pins";

interface PinCommentsProps {
  pinId: string | number;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError && error.status === 401) {
    return "Sign in to continue. Your session may have expired.";
  }

  return error instanceof Error ? error.message : fallback;
}

function getCommentDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function mergeComments(
  current: PinComment[],
  incoming: PinComment[],
): PinComment[] {
  const commentsById = new Map(
    current.map((comment) => [String(comment.id), comment]),
  );

  for (const comment of incoming) {
    commentsById.set(String(comment.id), comment);
  }

  return [...commentsById.values()];
}

export function PinComments({ pinId }: PinCommentsProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<PinComment[]>([]);
  const [page, setPage] = useState<PinCommentPage["pagination"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const [newContent, setNewContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const currentUserId =
    typeof user?.id === "string" || typeof user?.id === "number"
      ? String(user.id)
      : null;

  const refreshComments = useCallback(async () => {
    const result = await getPinComments(pinId);
    setComments(result.comments);
    setPage(result.pagination);
    setLoadError(null);
  }, [pinId]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    void getPinComments(pinId, 1, controller.signal)
      .then((result) => {
        if (active) {
          setComments(result.comments);
          setPage(result.pagination);
        }
      })
      .catch((error: unknown) => {
        if (active && !controller.signal.aborted) {
          setLoadError(
            getErrorMessage(error, "Comments could not be loaded. Try again."),
          );
        }
      })
      .finally(() => {
        if (active && !controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [pinId, retryToken]);

  async function loadMoreComments() {
    if (!page?.hasNextPage || isLoadingMore) {
      return;
    }

    setIsLoadingMore(true);
    setLoadError(null);

    try {
      const result = await getPinComments(pinId, page.page + 1);
      setComments((current) => mergeComments(current, result.comments));
      setPage(result.pagination);
    } catch (error) {
      setLoadError(
        getErrorMessage(error, "More comments could not be loaded. Try again."),
      );
    } finally {
      setIsLoadingMore(false);
    }
  }

  async function refreshAfterMutation(successMessage: string) {
    setNotice(successMessage);
    setActionError(null);

    try {
      await refreshComments();
    } catch (error) {
      setLoadError(
        `Your change was saved, but the comment list could not be refreshed. ${getErrorMessage(error, "Try again.")}`,
      );
    }
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = newContent.trim();

    if (!content || activeActionId) {
      return;
    }

    setActiveActionId("new");
    setActionError(null);
    setNotice(null);

    try {
      await createPinComment(pinId, content);
      setNewContent("");
      await refreshAfterMutation("Comment added.");
    } catch (error) {
      setActionError(
        getErrorMessage(error, "Your comment could not be added."),
      );
    } finally {
      setActiveActionId(null);
    }
  }

  function beginEditing(comment: PinComment) {
    setEditingId(String(comment.id));
    setEditingContent(comment.content);
    setActionError(null);
    setNotice(null);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditingContent("");
    setActionError(null);
  }

  async function handleUpdate(
    event: FormEvent<HTMLFormElement>,
    comment: PinComment,
  ) {
    event.preventDefault();
    const content = editingContent.trim();

    if (!content || activeActionId) {
      return;
    }

    setActiveActionId(String(comment.id));
    setActionError(null);
    setNotice(null);

    try {
      await updatePinComment(pinId, comment.id, content);
      cancelEditing();
      await refreshAfterMutation("Comment updated.");
    } catch (error) {
      setActionError(
        getErrorMessage(error, "Your comment could not be updated."),
      );
    } finally {
      setActiveActionId(null);
    }
  }

  async function handleDelete(comment: PinComment) {
    if (activeActionId) {
      return;
    }

    setActiveActionId(String(comment.id));
    setActionError(null);
    setNotice(null);

    try {
      await deletePinComment(pinId, comment.id);
      await refreshAfterMutation("Comment deleted.");
    } catch (error) {
      setActionError(
        getErrorMessage(error, "Your comment could not be deleted."),
      );
    } finally {
      setActiveActionId(null);
    }
  }

  return (
    <section
      aria-labelledby="pin-comments-title"
      aria-busy={isLoading || isLoadingMore}
      className="border-border mt-6 border-t pt-5"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3
          id="pin-comments-title"
          className="text-foreground text-lg font-semibold"
        >
          Comments
        </h3>
        {page ? (
          <span className="text-muted-foreground text-xs">
            {page.total} {page.total === 1 ? "comment" : "comments"}
          </span>
        ) : null}
      </div>

      {isLoading ? (
        <div role="status" className="text-muted-foreground py-6 text-sm">
          Loading comments…
        </div>
      ) : loadError && comments.length === 0 ? (
        <div className="border-danger/30 bg-danger/5 mt-4 rounded-md border p-4">
          <p role="alert" className="text-danger text-sm leading-6">
            {loadError}
          </p>
          <button
            type="button"
            onClick={() => {
              setIsLoading(true);
              setLoadError(null);
              setRetryToken((current) => current + 1);
            }}
            className="text-accent hover:text-accent-hover mt-2 inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4"
          >
            Try again
          </button>
        </div>
      ) : comments.length === 0 ? (
        <p className="text-muted-foreground bg-surface-muted/60 mt-4 rounded-md px-4 py-5 text-sm leading-6">
          No comments yet. Start the conversation about this Pin.
        </p>
      ) : (
        <ul className="divide-border mt-3 divide-y">
          {comments.map((comment) => {
            const isOwnComment =
              currentUserId !== null &&
              currentUserId === String(comment.author.id);

            return (
              <CommentItem
                key={comment.id}
                comment={comment}
                isOwnComment={isOwnComment}
                isEditing={editingId === String(comment.id)}
                isBusy={activeActionId === String(comment.id)}
                isAnyActionBusy={activeActionId !== null}
                editingContent={editingContent}
                actionError={actionError}
                onEdit={() => beginEditing(comment)}
                onCancelEdit={cancelEditing}
                onEditingContentChange={setEditingContent}
                onUpdate={(event) => void handleUpdate(event, comment)}
                onDelete={() => void handleDelete(comment)}
              />
            );
          })}
        </ul>
      )}

      {!isLoading && !loadError && page?.hasNextPage ? (
        <button
          type="button"
          onClick={() => void loadMoreComments()}
          disabled={isLoadingMore}
          className="border-border text-foreground hover:bg-surface-muted mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-md border px-4 text-sm font-semibold transition-colors disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none"
        >
          {isLoadingMore ? "Loading comments…" : "Load more comments"}
        </button>
      ) : null}

      {loadError && comments.length > 0 ? (
        <div className="border-danger/30 bg-danger/5 mt-3 rounded-md border p-3">
          <p role="alert" className="text-danger text-sm leading-6">
            {loadError}
          </p>
          <button
            type="button"
            onClick={() => {
              void refreshComments().catch((error: unknown) => {
                setLoadError(
                  getErrorMessage(error, "Comments could not be refreshed."),
                );
              });
            }}
            className="text-accent hover:text-accent-hover mt-1 inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4"
          >
            Refresh comments
          </button>
        </div>
      ) : null}

      {user ? (
        <form onSubmit={(event) => void handleCreate(event)} className="mt-5">
          <label
            htmlFor="new-pin-comment"
            className="text-foreground block text-sm font-semibold"
          >
            Add a comment
          </label>
          <textarea
            id="new-pin-comment"
            value={newContent}
            onChange={(event) => setNewContent(event.target.value)}
            rows={3}
            required
            disabled={activeActionId !== null}
            placeholder="Share what you think about this Pin…"
            className="border-border bg-surface text-foreground placeholder:text-muted-foreground focus-visible:outline-accent mt-2 block w-full resize-y rounded-md border px-3 py-2.5 text-sm leading-6 disabled:opacity-60"
          />
          {actionError ? (
            <p role="alert" className="text-danger mt-2 text-sm leading-6">
              {actionError}
            </p>
          ) : null}
          {notice ? (
            <p role="status" className="text-accent mt-2 text-sm font-medium">
              {notice}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={!newContent.trim() || activeActionId !== null}
            className="bg-accent text-accent-foreground hover:bg-accent-hover mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-md px-4 text-sm font-semibold transition-colors disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none"
          >
            {activeActionId === "new" ? "Posting…" : "Post comment"}
          </button>
        </form>
      ) : (
        <p className="text-muted-foreground border-border mt-5 border-t pt-4 text-sm leading-6">
          <Link
            href="/login"
            className="text-accent hover:text-accent-hover font-semibold underline underline-offset-2"
          >
            Sign in
          </Link>{" "}
          to join the conversation.
        </p>
      )}
    </section>
  );
}

function CommentItem({
  comment,
  isOwnComment,
  isEditing,
  isBusy,
  isAnyActionBusy,
  editingContent,
  actionError,
  onEdit,
  onCancelEdit,
  onEditingContentChange,
  onUpdate,
  onDelete,
}: {
  comment: PinComment;
  isOwnComment: boolean;
  isEditing: boolean;
  isBusy: boolean;
  isAnyActionBusy: boolean;
  editingContent: string;
  actionError: string | null;
  onEdit: () => void;
  onCancelEdit: () => void;
  onEditingContentChange: (content: string) => void;
  onUpdate: (event: FormEvent<HTMLFormElement>) => void;
  onDelete: () => void;
}) {
  const imageUrl = getSafeDestinationUrl(comment.author.profileImage);
  const displayName = comment.author.name.trim() || comment.author.username;
  const initial = displayName.charAt(0).toLocaleUpperCase() || "P";

  return (
    <li className="py-4 first:pt-3 last:pb-0">
      <article>
        <div className="flex items-start gap-3">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt=""
              width={36}
              height={36}
              unoptimized
              className="border-border size-9 shrink-0 rounded-full border object-cover"
            />
          ) : (
            <span
              aria-hidden="true"
              className="bg-surface-muted text-accent border-border grid size-9 shrink-0 place-items-center rounded-full border text-xs font-semibold"
            >
              {initial}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <Link
                href={`/users/${encodeURIComponent(comment.author.username)}`}
                className="text-foreground hover:text-accent-hover truncate text-sm font-semibold"
              >
                {displayName}
              </Link>
              <time
                dateTime={comment.createdAt}
                className="text-muted-foreground text-xs"
              >
                {getCommentDate(comment.createdAt)}
              </time>
            </div>
            <p className="text-muted-foreground mt-0.5 text-xs">
              @{comment.author.username}
            </p>

            {isEditing ? (
              <form onSubmit={onUpdate} className="mt-3">
                <label
                  htmlFor={`edit-comment-${comment.id}`}
                  className="sr-only"
                >
                  Edit your comment
                </label>
                <textarea
                  id={`edit-comment-${comment.id}`}
                  value={editingContent}
                  onChange={(event) =>
                    onEditingContentChange(event.target.value)
                  }
                  rows={3}
                  required
                  disabled={isBusy}
                  className="border-border bg-surface text-foreground focus-visible:outline-accent block w-full resize-y rounded-md border px-3 py-2.5 text-sm leading-6 disabled:opacity-60"
                />
                {actionError ? (
                  <p
                    role="alert"
                    className="text-danger mt-2 text-sm leading-6"
                  >
                    {actionError}
                  </p>
                ) : null}
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="submit"
                    disabled={!editingContent.trim() || isAnyActionBusy}
                    className="bg-accent text-accent-foreground hover:bg-accent-hover inline-flex min-h-11 items-center justify-center rounded-md px-4 text-sm font-semibold disabled:cursor-wait disabled:opacity-60"
                  >
                    {isBusy ? "Saving…" : "Save edit"}
                  </button>
                  <button
                    type="button"
                    onClick={onCancelEdit}
                    disabled={isAnyActionBusy}
                    className="border-border text-foreground hover:bg-surface-muted inline-flex min-h-11 items-center justify-center rounded-md border px-4 text-sm font-semibold disabled:opacity-60"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                <p className="text-foreground mt-2 text-sm leading-6 [overflow-wrap:anywhere] whitespace-pre-wrap">
                  {comment.content}
                </p>
                {isOwnComment ? (
                  <div className="mt-1 flex flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={onEdit}
                      disabled={isAnyActionBusy}
                      className="text-accent hover:text-accent-hover inline-flex min-h-11 items-center px-2 text-sm font-semibold underline underline-offset-2 disabled:opacity-60"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={onDelete}
                      disabled={isAnyActionBusy}
                      className="text-danger inline-flex min-h-11 items-center px-2 text-sm font-semibold underline underline-offset-2 disabled:cursor-wait disabled:opacity-60"
                    >
                      {isBusy ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      </article>
    </li>
  );
}
