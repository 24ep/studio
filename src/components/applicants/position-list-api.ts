import type { Position } from "@/lib/types";
import { getJsonArray, isJsonObject, readJsonOrFallback } from "@/lib/response-json";

export function normalizePositionList(value: unknown): Position[] {
  const positions = Array.isArray(value)
    ? value
    : isJsonObject(value)
      ? getJsonArray(value, "data") ?? []
      : [];
  return positions.filter(isJsonObject).map((position) => position as unknown as Position);
}

export async function fetchApplicantPositionList(fetcher: typeof fetch = fetch) {
  const response = await fetcher("/api/positions/all", {
    headers: { "Cache-Control": "no-cache" },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch positions");
  }

  return normalizePositionList(await readJsonOrFallback<unknown>(response, {}));
}
