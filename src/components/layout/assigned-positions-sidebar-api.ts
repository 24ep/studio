import { readJsonOrFallback } from "@/lib/response-json";
import type { AssignedPositionsResponse } from "./AssignedPositionsSidebarTypes";
import { normalizeAssignedPositionsResponse } from "./assigned-positions-sidebar-utils";

export async function fetchAssignedPositionsForRecruiter(recruiterId: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(
      `/api/positions/recruiter-assigned?recruiterId=${encodeURIComponent(recruiterId)}`,
      {
        credentials: "include",
        signal: controller.signal,
        headers: { Accept: "application/json" },
      },
    );

    if (!response.ok) {
      const details = await readResponseText(response);
      throw new Error(`Failed to fetch assigned positions (${response.status}) ${details}`.trim());
    }

    const payload = await readJsonOrFallback<AssignedPositionsResponse>(response, { data: [] });
    return normalizeAssignedPositionsResponse(payload);
  } finally {
    clearTimeout(timeout);
  }
}

async function readResponseText(response: Response) {
  try {
    return await response.text();
  } catch {
    return "";
  }
}
