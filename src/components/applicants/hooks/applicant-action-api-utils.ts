import type { Applicant } from "../../../lib/types";
import {
  getJsonArray,
  getJsonErrorMessage,
  getJsonString,
  isJsonObject,
  readJsonObject,
  readJsonOrFallback,
} from "../../../lib/response-json";

export async function fetchOriginalApplicant(applicantId: string): Promise<Applicant | null> {
  try {
    const response = await fetch(`/api/applicants/${applicantId}`);
    if (response.ok) {
      return await readJsonOrFallback<Applicant | null>(response, null);
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error fetching applicant:", error);
    }
  }

  return null;
}

export async function postApplicantBulkAction(body: Record<string, unknown>, failureMessage: string) {
  const response = await fetch("/api/applicants/bulk-action", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await readJsonObject(response);
    if (response.status === 403) {
      throw new Error("Permission denied: You do not have permission to update applicant status. Please contact your administrator.");
    }
    throw new Error(getJsonErrorMessage(errorData, failureMessage));
  }

  return readJsonOrFallback<unknown>(response, {});
}

export async function putApplicantUpdate(applicantId: string, body: Record<string, unknown>, failureMessage: string) {
  const response = await fetch(`/api/applicants/${applicantId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await readJsonObject(response);
    throw new Error(getJsonErrorMessage(errorData, failureMessage));
  }
}

export function getRejectedApplicantMessage(result: unknown, applicantId: string) {
  const resultObject = isJsonObject(result) ? result : {};
  const rejectedApplicants = getJsonArray(resultObject, "rejectedApplicants") ?? [];
  const rejectedApplicant = rejectedApplicants.find((candidate) => (
    isJsonObject(candidate) && getJsonString(candidate, "applicantId") === applicantId
  ));

  return isJsonObject(rejectedApplicant)
    ? getJsonString(rejectedApplicant, "message")
    : undefined;
}
