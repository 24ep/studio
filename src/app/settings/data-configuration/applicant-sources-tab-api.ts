import { getJsonErrorMessage, readJsonObject, readJsonOrFallback } from "../../../lib/response-json";
import type { ApplicantSource } from "../../../lib/types";

export async function fetchApplicantSources() {
  const response = await fetch("/api/settings/applicant-sources");
  if (!response.ok) {
    throw new Error(`Failed to fetch sources: ${response.status}`);
  }

  return readJsonOrFallback<ApplicantSource[]>(response, []);
}

export async function deleteApplicantSource(sourceId: string) {
  const response = await fetch(`/api/settings/applicant-sources/${sourceId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const errorData = await readJsonObject(response);
    throw new Error(getJsonErrorMessage(errorData, "Failed to delete source"));
  }
}

export async function reorderApplicantSources(sourceIds: string[]) {
  const response = await fetch("/api/settings/applicant-sources/reorder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sourceIds }),
  });

  if (response.ok) {
    return null;
  }

  const errorData = await readJsonObject(response);

  if (response.status === 403) {
    return "Access denied: You do not have permission to reorder Applicant sources. Please contact your administrator.";
  }

  if (response.status === 401) {
    return "Session expired: Please refresh the page and try again.";
  }

  return getJsonErrorMessage(errorData, "Failed to update source order");
}

export async function loadApplicantSourcesFromAppKit(environment: "development" | "production") {
  const response = await fetch("/api/settings/applicant-sources/import-appkit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ environment }),
  });

  if (!response.ok) {
    const errorData = await readJsonObject(response);
    throw new Error(getJsonErrorMessage(errorData, "Failed to load Applicant sources from AppKit"));
  }
}

export function reorderApplicantSourceList(
  sources: ApplicantSource[],
  sourceIndex: number,
  destinationIndex: number,
) {
  const items = Array.from(sources);
  const [reorderedItem] = items.splice(sourceIndex, 1);
  items.splice(destinationIndex, 0, reorderedItem);

  return items.map((item, index) => ({
    ...item,
    sortOrder: index + 1,
  }));
}
