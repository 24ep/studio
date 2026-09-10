import { readJsonOrFallback } from "@/lib/response-json";
import {
  buildPendingCountNoPermissionState,
  buildPendingCountStateFromHealthPayload,
  type PendingCountState,
} from "./pending-count-utils";

export async function fetchPendingCountState(): Promise<PendingCountState> {
  try {
    const response = await fetch("/api/upload-queue/health", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return buildPendingCountNoPermissionState();
    }

    return buildPendingCountStateFromHealthPayload(
      await readJsonOrFallback<unknown>(response, {})
    );
  } catch {
    return buildPendingCountNoPermissionState();
  }
}
