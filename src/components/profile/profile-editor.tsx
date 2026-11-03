"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { ErrorState } from "@/components/states/error-state";
import { LoadingState } from "@/components/states/loading-state";
import { ApiError } from "@/services/api-client";
import {
  getCurrentSession,
  getMyProfile,
  getSafeImageUrl,
  updateMyProfile,
  uploadProfileImage,
  type UserProfile,
} from "@/services/profile-api";

interface ProfileForm {
  name: string;
  username: string;
  bio: string;
}

const emptyForm: ProfileForm = {
  name: "",
  username: "",
  bio: "",
};

export function ProfileEditor() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<Error | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [loadedRetryKey, setLoadedRetryKey] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function loadProfile() {
      try {
        await getCurrentSession(controller.signal);
        const userProfile = await getMyProfile(controller.signal);

        if (active) {
          setProfile(userProfile);
          setForm({
            name: userProfile.name,
            username: userProfile.username,
            bio: userProfile.bio ?? "",
          });
          setLoadError(null);
          setLoadedRetryKey(retryKey);
        }
      } catch (error) {
        if (active) {
          setLoadError(asError(error));
          setLoadedRetryKey(retryKey);
        }
      }
    }

    void loadProfile();

    return () => {
      active = false;
      controller.abort();
    };
  }, [retryKey]);

  function updateField(field: keyof ProfileForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setFormError(null);
    setSaved(false);
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0] ?? null;

    if (file && !file.type.startsWith("image/")) {
      setImageFile(null);
      setFormError("Choose an image file to update your profile photo.");
      event.currentTarget.value = "";
      return;
    }

    setImageFile(file);
    setFormError(null);
    setSaved(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSaved(false);

    if (!form.name.trim() || !form.username.trim()) {
      setFormError("Add your name and username before saving.");
      return;
    }

    if (!profile) {
      setFormError("Your profile is not ready to edit yet. Try again.");
      return;
    }

    setSaving(true);

    try {
      const profileImage = imageFile
        ? await uploadProfileImage(imageFile)
        : profile.profileImage;
      const updatedProfile = await updateMyProfile({
        name: form.name.trim(),
        username: form.username.trim(),
        bio: form.bio.trim(),
        profileImage,
      });

      setProfile(updatedProfile);
      setForm({
        name: updatedProfile.name,
        username: updatedProfile.username,
        bio: updatedProfile.bio ?? "",
      });
      setImageFile(null);
      setSaved(true);
    } catch (error) {
      setFormError(asError(error).message);
    } finally {
      setSaving(false);
    }
  }

  if (loadedRetryKey !== retryKey) {
    return <LoadingState label="Loading your profile" />;
  }

  if (!profile || loadError) {
    const unauthorized =
      loadError instanceof ApiError &&
      (loadError.status === 401 || loadError.status === 403);

    return (
      <ErrorState
        title={
          unauthorized
            ? "Sign in to edit your profile"
            : "Your profile could not be loaded"
        }
        description={
          unauthorized
            ? "Profile settings are available after you sign in to Pincrest."
            : (loadError?.message ??
              "The profile information is unavailable right now.")
        }
        onRetry={() => setRetryKey((value) => value + 1)}
      />
    );
  }

  const currentImageUrl = getSafeImageUrl(profile.profileImage);

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
      <Link
        href="/profile"
        className="text-muted-foreground hover:text-foreground inline-flex min-h-11 items-center rounded-md text-sm font-medium transition-colors motion-reduce:transition-none"
      >
        Back to profile
      </Link>

      <header className="mt-5">
        <p className="text-muted-foreground text-xs font-semibold tracking-[0.16em] uppercase">
          Your account
        </p>
        <h1 className="text-foreground mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Edit profile
        </h1>
        <p className="text-muted-foreground mt-3 max-w-xl text-sm leading-6">
          Keep your public profile recognizable and easy for others to find.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="border-border bg-surface mt-8 rounded-lg border p-5 sm:p-8"
      >
        <div className="border-border flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-center">
          {currentImageUrl ? (
            <Image
              src={currentImageUrl}
              alt={`${profile.name}'s current profile photo`}
              width={80}
              height={80}
              unoptimized
              className="border-border size-20 rounded-full border object-cover"
            />
          ) : (
            <span className="bg-surface-muted text-accent border-border grid size-20 place-items-center rounded-full border text-2xl font-semibold">
              {profile.name.trim().charAt(0).toLocaleUpperCase() || "P"}
            </span>
          )}
          <div>
            <label
              htmlFor="profile-image"
              className="text-foreground block text-sm font-semibold"
            >
              Profile image
            </label>
            <input
              id="profile-image"
              name="profileImage"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="text-muted-foreground file:bg-surface-muted file:text-foreground hover:file:bg-border mt-2 block min-h-11 w-full max-w-sm text-sm file:mr-3 file:min-h-10 file:cursor-pointer file:rounded-md file:border-0 file:px-3 file:font-semibold"
            />
            <p className="text-muted-foreground mt-1 text-xs leading-5">
              {imageFile
                ? `Selected: ${imageFile.name}`
                : "Choose an image file from your device."}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-5">
          <FormField
            id="profile-name"
            label="Name"
            value={form.name}
            onChange={(value) => updateField("name", value)}
            required
          />
          <FormField
            id="profile-username"
            label="Username"
            value={form.username}
            onChange={(value) => updateField("username", value)}
            prefix="@"
            required
          />
          <div>
            <label
              htmlFor="profile-bio"
              className="text-foreground block text-sm font-semibold"
            >
              Bio
            </label>
            <textarea
              id="profile-bio"
              name="bio"
              value={form.bio}
              onChange={(event) =>
                updateField("bio", event.currentTarget.value)
              }
              rows={4}
              className="border-border bg-surface text-foreground placeholder:text-muted-foreground focus:border-accent mt-2 block w-full rounded-md border px-3 py-2.5 text-sm leading-6 transition-colors outline-none motion-reduce:transition-none"
              placeholder="A little about what inspires you"
            />
          </div>
        </div>

        {formError ? (
          <p role="alert" className="text-danger mt-5 text-sm leading-6">
            {formError}
          </p>
        ) : null}

        {saved ? (
          <div
            role="status"
            className="border-border bg-surface-muted mt-5 rounded-md px-4 py-3 text-sm leading-6"
          >
            <p className="text-foreground font-semibold">Profile saved</p>
            <p className="text-muted-foreground mt-1">
              Your changes are saved to your Pincrest profile.
            </p>
          </div>
        ) : null}

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
          <Link
            href="/profile"
            className="text-muted-foreground hover:text-foreground inline-flex min-h-11 items-center justify-center rounded-md px-4 text-sm font-semibold transition-colors motion-reduce:transition-none"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="bg-accent text-accent-foreground hover:bg-accent-hover inline-flex min-h-11 items-center justify-center rounded-md px-5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
          >
            {saving ? "Saving changes…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

function FormField({
  id,
  label,
  value,
  onChange,
  prefix,
  required = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  prefix?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="text-foreground block text-sm font-semibold"
      >
        {label}
      </label>
      <div className="border-border bg-surface focus-within:border-accent mt-2 flex min-h-11 items-center rounded-md border">
        {prefix ? (
          <span
            className="text-muted-foreground pl-3 text-sm"
            aria-hidden="true"
          >
            {prefix}
          </span>
        ) : null}
        <input
          id={id}
          name={id}
          type="text"
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
          required={required}
          autoComplete={id === "profile-name" ? "name" : "username"}
          className="text-foreground placeholder:text-muted-foreground min-h-11 min-w-0 flex-1 rounded-md bg-transparent px-3 text-sm outline-none"
        />
      </div>
    </div>
  );
}

function asError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  return new Error("The profile request could not be completed.");
}
