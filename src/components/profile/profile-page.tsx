"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { LoadingState } from "@/components/states/loading-state";
import { ApiError } from "@/services/api-client";
import {
  getCurrentSession,
  getMyPins,
  getMyProfile,
  getPublicPins,
  getPublicProfile,
  getSafeImageUrl,
  type ProfilePin,
  type UserProfile,
} from "@/services/profile-api";

interface ProfilePageProps {
  mode: "public" | "mine";
  username?: string;
}

interface ProfileState {
  profile: UserProfile | null;
  pins: ProfilePin[];
  loading: boolean;
  requestKey: string | null;
  profileError: Error | null;
  pinsError: Error | null;
}

const initialState: ProfileState = {
  profile: null,
  pins: [],
  loading: true,
  requestKey: null,
  profileError: null,
  pinsError: null,
};

export function ProfilePage({ mode, username }: ProfilePageProps) {
  const [state, setState] = useState(initialState);
  const [retryKey, setRetryKey] = useState(0);
  const isMine = mode === "mine";
  const requestKey = `${mode}:${username ?? ""}:${retryKey}`;

  useEffect(() => {
    const currentRequestKey = requestKey;
    const controller = new AbortController();
    let active = true;

    async function loadProfile() {
      try {
        if (isMine) {
          await getCurrentSession(controller.signal);
        }

        const profileRequest = isMine
          ? getMyProfile(controller.signal)
          : getPublicProfile(username ?? "", controller.signal);
        const pinsRequest = isMine
          ? getMyPins(controller.signal)
          : getPublicPins(username ?? "", controller.signal);
        const [profileResult, pinsResult] = await Promise.allSettled([
          profileRequest,
          pinsRequest,
        ]);

        if (!active) {
          return;
        }

        setState({
          profile:
            profileResult.status === "fulfilled" ? profileResult.value : null,
          pins: pinsResult.status === "fulfilled" ? pinsResult.value : [],
          loading: false,
          requestKey: currentRequestKey,
          profileError:
            profileResult.status === "rejected"
              ? asError(profileResult.reason)
              : null,
          pinsError:
            pinsResult.status === "rejected"
              ? asError(pinsResult.reason)
              : null,
        });
      } catch (error) {
        if (active) {
          setState({
            ...initialState,
            loading: false,
            requestKey: currentRequestKey,
            profileError: asError(error),
          });
        }
      }
    }

    void loadProfile();

    return () => {
      active = false;
      controller.abort();
    };
  }, [isMine, requestKey, retryKey, username]);

  if (state.loading || state.requestKey !== requestKey) {
    return <LoadingState label="Loading profile" />;
  }

  if (state.profileError || !state.profile) {
    const isMissing =
      !isMine &&
      state.profileError instanceof ApiError &&
      state.profileError.status === 404;
    const isUnauthorized =
      state.profileError instanceof ApiError &&
      (state.profileError.status === 401 || state.profileError.status === 403);

    return (
      <ErrorState
        title={
          isMissing
            ? "Profile not found"
            : isUnauthorized && isMine
              ? "Sign in to view your profile"
              : "We couldn't load this profile"
        }
        description={
          isMissing
            ? "That username doesn't match a Pincrest profile. Check the address and try again."
            : isUnauthorized && isMine
              ? "Your profile is available after you sign in to Pincrest."
              : (state.profileError?.message ??
                "The profile information is unavailable right now.")
        }
        onRetry={() => setRetryKey((value) => value + 1)}
      />
    );
  }

  return (
    <ProfileView
      profile={state.profile}
      pins={state.pins}
      pinsError={state.pinsError}
      isMine={isMine}
      onRetry={() => setRetryKey((value) => value + 1)}
    />
  );
}

function asError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  return new Error("The profile request could not be completed.");
}

interface ProfileViewProps {
  profile: UserProfile;
  pins: ProfilePin[];
  pinsError: Error | null;
  isMine: boolean;
  onRetry: () => void;
}

function ProfileView({
  profile,
  pins,
  pinsError,
  isMine,
  onRetry,
}: ProfileViewProps) {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <Link
        href={isMine ? "/" : "/profile"}
        className="text-muted-foreground hover:text-foreground inline-flex min-h-11 items-center rounded-md text-sm font-medium transition-colors motion-reduce:transition-none"
      >
        {isMine ? "Back to home" : "My profile"}
      </Link>

      <header className="border-border mt-5 flex flex-col items-center gap-6 border-b pb-9 text-center sm:flex-row sm:items-start sm:gap-8 sm:pb-10 sm:text-left">
        <ProfileAvatar profile={profile} size="large" />

        <div className="min-w-0 flex-1">
          <p className="text-muted-foreground text-sm font-medium">
            @{profile.username}
          </p>
          <h1 className="text-foreground mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
            {profile.name}
          </h1>
          {profile.bio ? (
            <p className="text-muted-foreground mt-3 max-w-2xl text-sm leading-6 whitespace-pre-wrap sm:text-base sm:leading-7">
              {profile.bio}
            </p>
          ) : null}
          <dl className="mt-5 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm sm:justify-start">
            <Count label="followers" value={profile.followersCount} />
            <Count label="following" value={profile.followingCount} />
            <Count label="pins" value={profile.pinsCount} />
          </dl>
        </div>

        {isMine ? (
          <div className="flex shrink-0 flex-col gap-2 sm:items-end">
            <Link
              href={`/users/${encodeURIComponent(profile.username)}`}
              className="text-accent hover:text-accent-hover inline-flex min-h-11 items-center justify-center rounded-md px-4 text-sm font-semibold transition-colors motion-reduce:transition-none"
            >
              View public profile
            </Link>
            <Link
              href="/settings/profile"
              className="border-border text-foreground hover:bg-surface-muted inline-flex min-h-11 items-center justify-center rounded-md border px-5 text-sm font-semibold transition-colors motion-reduce:transition-none"
            >
              Edit profile
            </Link>
          </div>
        ) : null}
      </header>

      <section aria-labelledby="profile-pins-heading" className="pt-8 sm:pt-10">
        <div className="mb-6 flex items-baseline justify-between gap-4">
          <h2
            id="profile-pins-heading"
            className="text-foreground text-xl font-semibold tracking-tight"
          >
            Pins
          </h2>
          <span className="text-muted-foreground text-sm tabular-nums">
            {profile.pinsCount.toLocaleString()}
          </span>
        </div>

        {pinsError ? (
          <PinsError error={pinsError} isMine={isMine} onRetry={onRetry} />
        ) : pins.length === 0 ? (
          <EmptyState
            title={
              profile.pinsCount > 0
                ? "Pins aren't available right now"
                : isMine
                  ? "Your pinboard is ready"
                  : "No pins yet"
            }
            description={
              profile.pinsCount > 0
                ? "This profile has pins, but none were returned by the pin feed. Try again shortly."
                : isMine
                  ? "Pins you create will find a home here."
                  : `${profile.name} hasn't shared any pins yet.`
            }
          />
        ) : (
          <PinWall pins={pins} />
        )}
      </section>
    </div>
  );
}

function Count({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-muted-foreground inline-flex items-baseline gap-1.5">
      <dt className="text-foreground font-semibold tabular-nums">
        {value.toLocaleString()}
      </dt>
      <dd>{label}</dd>
    </div>
  );
}

function ProfileAvatar({
  profile,
  size,
}: {
  profile: UserProfile;
  size: "large" | "small";
}) {
  const imageUrl = getSafeImageUrl(profile.profileImage);
  const dimensions = size === "large" ? 128 : 40;

  return imageUrl ? (
    <Image
      src={imageUrl}
      alt={`${profile.name}'s profile`}
      width={dimensions}
      height={dimensions}
      unoptimized
      className={
        size === "large"
          ? "border-border size-28 shrink-0 rounded-full border object-cover sm:size-32"
          : "border-border size-10 shrink-0 rounded-full border object-cover"
      }
    />
  ) : (
    <span
      aria-label={`${profile.name}'s profile image is not available`}
      className={
        size === "large"
          ? "bg-surface-muted text-accent border-border grid size-28 shrink-0 place-items-center rounded-full border text-3xl font-semibold sm:size-32"
          : "bg-surface-muted text-accent border-border grid size-10 shrink-0 place-items-center rounded-full border text-sm font-semibold"
      }
    >
      {profile.name.trim().charAt(0).toLocaleUpperCase() || "P"}
    </span>
  );
}

function PinWall({ pins }: { pins: ProfilePin[] }) {
  const imageRatios = ["aspect-[4/5]", "aspect-[3/4]", "aspect-square"];

  return (
    <ul className="columns-2 gap-4 sm:columns-3 lg:columns-4">
      {pins.map((pin, index) => {
        const imageUrl = getSafeImageUrl(pin.imageUrl);
        const ratioClass = imageRatios[index % imageRatios.length];

        return (
          <li key={pin.id} className="mb-4 break-inside-avoid">
            <article className="group border-border bg-surface overflow-hidden rounded-lg border">
              <div
                className={`bg-surface-muted relative overflow-hidden ${ratioClass}`}
              >
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={pin.title}
                    fill
                    unoptimized
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.025] motion-reduce:transition-none"
                  />
                ) : (
                  <span className="text-muted-foreground grid h-full place-items-center px-4 text-center text-xs">
                    Image unavailable
                  </span>
                )}
              </div>
              <h3 className="text-foreground px-3 py-3 text-sm leading-5 font-medium">
                {pin.title}
              </h3>
            </article>
          </li>
        );
      })}
    </ul>
  );
}

function PinsError({
  error,
  isMine,
  onRetry,
}: {
  error: Error;
  isMine: boolean;
  onRetry: () => void;
}) {
  const isPublicEndpointUnavailable =
    !isMine && error instanceof ApiError && error.status === 404;

  if (isPublicEndpointUnavailable) {
    return (
      <section
        role="status"
        className="border-border bg-surface rounded-lg border px-5 py-6"
      >
        <h3 className="text-foreground font-semibold">
          Public pins are not available yet
        </h3>
        <p className="text-muted-foreground mt-2 text-sm leading-6">
          This profile is ready to share. Its pin gallery will appear once the
          public pins service is available.
        </p>
      </section>
    );
  }

  return (
    <section
      role="alert"
      className="border-border bg-surface rounded-lg border px-5 py-6"
    >
      <h3 className="text-foreground font-semibold">
        Pins could not be loaded
      </h3>
      <p className="text-muted-foreground mt-2 text-sm leading-6">
        {error.message}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="bg-accent text-accent-foreground hover:bg-accent-hover mt-4 inline-flex min-h-11 items-center justify-center rounded-md px-4 text-sm font-semibold transition-colors motion-reduce:transition-none"
      >
        Try again
      </button>
    </section>
  );
}
