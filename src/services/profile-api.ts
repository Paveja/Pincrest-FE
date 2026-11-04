import { ApiError, apiRequest } from "@/services/api-client";

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  profileImage: string | null;
  bio: string | null;
  followersCount: number;
  followingCount: number;
  pinsCount: number;
  createdAt: string;
}

export interface ProfilePin {
  id: string;
  title: string;
  imageUrl: string;
}

interface DataEnvelope<T> {
  data: T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function isUserProfile(value: unknown): value is UserProfile {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.username === "string" &&
    (typeof value.profileImage === "string" || value.profileImage === null) &&
    (typeof value.bio === "string" || value.bio === null) &&
    isNonNegativeInteger(value.followersCount) &&
    isNonNegativeInteger(value.followingCount) &&
    isNonNegativeInteger(value.pinsCount) &&
    typeof value.createdAt === "string"
  );
}

function isProfilePin(value: unknown): value is ProfilePin {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.imageUrl === "string"
  );
}

function getResponseData<T>(
  response: DataEnvelope<unknown>,
  validate: (value: unknown) => value is T,
  description: string,
): T {
  if (!isRecord(response) || !validate(response.data)) {
    throw new ApiError(`The backend returned an invalid ${description}.`, null);
  }

  return response.data;
}

function getSessionOptions(signal?: AbortSignal): RequestInit {
  return {
    credentials: "include",
    ...(signal ? { signal } : {}),
  };
}

function isPinList(value: unknown): value is { pins: ProfilePin[] } {
  return (
    isRecord(value) &&
    Array.isArray(value.pins) &&
    value.pins.every(isProfilePin)
  );
}

function isHttpImageUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function getSafeImageUrl(value: string | null): string | null {
  return value && isHttpImageUrl(value) ? value : null;
}

export async function getCurrentSession(signal?: AbortSignal): Promise<void> {
  await apiRequest<unknown>("auth/me", getSessionOptions(signal));
}

export async function getMyProfile(signal?: AbortSignal): Promise<UserProfile> {
  const response = await apiRequest<DataEnvelope<unknown>>(
    "users/me",
    getSessionOptions(signal),
  );

  return getResponseData(response, isUserProfile, "profile");
}

export async function getPublicProfile(
  username: string,
  signal?: AbortSignal,
): Promise<UserProfile> {
  const response = await apiRequest<DataEnvelope<unknown>>(
    `users/${encodeURIComponent(username)}`,
    getSessionOptions(signal),
  );

  return getResponseData(response, isUserProfile, "profile");
}

async function getPins(
  path: string,
  signal?: AbortSignal,
): Promise<ProfilePin[]> {
  const response = await apiRequest<DataEnvelope<unknown>>(
    path,
    getSessionOptions(signal),
  );
  const result = getResponseData(response, isPinList, "pin list");

  return result.pins;
}

export function getMyPins(signal?: AbortSignal): Promise<ProfilePin[]> {
  return getPins("pins/mine", signal);
}

export function getPublicPins(
  username: string,
  signal?: AbortSignal,
): Promise<ProfilePin[]> {
  return getPins(`users/${encodeURIComponent(username)}/pins`, signal);
}

export async function uploadProfileImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new ApiError("Choose an image file to upload.", null);
  }

  const body = new FormData();
  body.set("image", file);

  const response = await apiRequest<DataEnvelope<unknown>>("uploads/images", {
    method: "POST",
    body,
    credentials: "include",
  });

  const result = getResponseData(
    response,
    (value): value is { url: string } =>
      isRecord(value) &&
      typeof value.url === "string" &&
      isHttpImageUrl(value.url),
    "uploaded image",
  );

  return result.url;
}

export async function updateMyProfile(
  profile: Pick<UserProfile, "name" | "username" | "bio" | "profileImage">,
): Promise<UserProfile> {
  const response = await apiRequest<DataEnvelope<unknown>>("users/me", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(profile),
    credentials: "include",
  });

  return getResponseData(response, isUserProfile, "updated profile");
}

function getConnectionListPath(
  userId: string,
  relation: "followers" | "following",
  page: number,
  limit: number,
): string {
  if (!Number.isSafeInteger(page) || page < 1) {
    throw new ApiError("The connection page must be a positive integer.", null);
  }

  if (!Number.isSafeInteger(limit) || limit < 1) {
    throw new ApiError(
      "The connection page size must be a positive integer.",
      null,
    );
  }

  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  return `/api/v1/users/${encodeURIComponent(userId)}/${relation}?${params.toString()}`;
}

export function followUser(userId: string): Promise<void> {
  return apiRequest<void>(
    `/api/v1/users/${encodeURIComponent(userId)}/follow`,
    { method: "POST" },
  );
}

export function unfollowUser(userId: string): Promise<void> {
  return apiRequest<void>(
    `/api/v1/users/${encodeURIComponent(userId)}/follow`,
    { method: "DELETE" },
  );
}

export function getUserFollowers(
  userId: string,
  page = 1,
  limit = 20,
): Promise<unknown> {
  return apiRequest<unknown>(
    getConnectionListPath(userId, "followers", page, limit),
  );
}

export function getUserFollowing(
  userId: string,
  page = 1,
  limit = 20,
): Promise<unknown> {
  return apiRequest<unknown>(
    getConnectionListPath(userId, "following", page, limit),
  );
}
