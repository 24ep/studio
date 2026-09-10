import type { CustomFieldValue, Position, UserProfile } from "@/lib/types";
import { getJsonArray, isJsonObject } from "../../../lib/response-json";

export function normalizeArrayPayload<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export function normalizeRecruiterOptions(
  value: unknown,
): Pick<UserProfile, "id" | "name" | "avatarUrl" | "personalColor">[] {
  return getRecruiterPayloadItems(value)
    .filter(isJsonObject)
    .filter((user) => typeof user.id === "string")
    .map((user) => ({
      id: user.id as string,
      name: getRecruiterDisplayName(user),
      avatarUrl:
        typeof user.avatarUrl === "string" ? user.avatarUrl : undefined,
      personalColor:
        typeof user.personalColor === "string" ? user.personalColor : undefined,
    }));
}

export function updatePositionCustomField(
  position: Position | null,
  fieldCode: string,
  value: CustomFieldValue,
) {
  if (!position) return position;

  return {
    ...position,
    customFields: {
      ...position.customFields,
      [fieldCode]: value,
    },
  };
}

function getRecruiterPayloadItems(value: unknown) {
  if (Array.isArray(value)) {
    return value;
  }

  return isJsonObject(value) ? (getJsonArray(value, "users") ?? []) : [];
}

function getRecruiterDisplayName(user: Record<string, unknown>) {
  if (typeof user.name === "string") {
    return user.name;
  }

  if (typeof user.email === "string") {
    return user.email;
  }

  return user.id as string;
}
