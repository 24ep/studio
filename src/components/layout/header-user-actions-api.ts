import type { UnifiedUserFormValues } from "@/components/users/UnifiedUserModal";
import { getJsonErrorMessage, readJsonObject } from "@/lib/response-json";
import type { UserProfile } from "@/lib/types";
import type { HeaderPreviewUserSummary } from "./HeaderUserMenu.types";
import {
  buildHeaderUserSearchUrl,
  normalizeHeaderPreviewUsers,
  type HeaderProfileUpdateResultLike,
} from "./use-header-user-actions-utils";

export function clearHeaderUserCache(userId: string) {
  return fetch("/api/auth/clear-user-cache", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
}

export async function updateHeaderUserProfile(
  userId: string,
  data: UnifiedUserFormValues,
): Promise<HeaderProfileUpdateResultLike> {
  const response = await fetch(`/api/users/${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const result = await readJsonObject(response);

  if (!response.ok) {
    throw new Error(getJsonErrorMessage(result, "Failed to update profile"));
  }

  return result;
}

export async function searchHeaderPreviewUsers(query: string): Promise<HeaderPreviewUserSummary[]> {
  const response = await fetch(buildHeaderUserSearchUrl(query));
  const data = await readJsonObject(response);
  return normalizeHeaderPreviewUsers(data);
}

export async function fetchHeaderUserProfile(userId: string): Promise<UserProfile | null> {
  const response = await fetch(`/api/users/${userId}`);

  if (!response.ok) {
    return null;
  }

  return normalizeHeaderUserProfile(await readJsonObject(response));
}

function normalizeHeaderUserProfile(data: Record<string, unknown>): UserProfile | null {
  if (typeof data.id !== "string" || typeof data.name !== "string" || typeof data.email !== "string") {
    return null;
  }

  return {
    ...data,
    id: data.id,
    name: data.name,
    email: data.email,
    role: typeof data.role === "string" ? data.role : "Recruiter",
  } as UserProfile;
}
