import type { Applicant } from "@/lib/types";
import { getJsonNumber, getJsonObject, isJsonObject, readJsonOrFallback } from "../../lib/response-json";
import { buildPositionApplicantsQuery, buildPotentialPositionApplicantsQuery } from "./position-detail-drawer-query-utils";
import type {
  FetchPositionApplicantsPageInput,
  FetchPotentialPositionApplicantsPageInput,
  PositionApplicantFetch,
  PositionApplicantsPageResult,
} from "./position-detail-drawer-types";

export function normalizePositionApplicantsPageResponse(data: unknown): PositionApplicantsPageResult {
  const response = isJsonObject(data) ? data : {};
  const applicants = Array.isArray(response.data) ? response.data as unknown as Applicant[] : [];
  const pagination = getJsonObject(response, "pagination");
  const total = pagination ? getJsonNumber(pagination, "total") ?? applicants.length
    : applicants.length;

  return { applicants, total };
}

export async function fetchPositionApplicantsPage(
  input: FetchPositionApplicantsPageInput,
  fetcher: PositionApplicantFetch = fetch,
) {
  const { positionId, ...queryInput } = input;
  const query = buildPositionApplicantsQuery(queryInput);
  return fetchPositionApplicantsPageResult({
    errorMessage: `Failed to fetch ${queryInput.applicantType} Applicants`,
    fetcher,
    url: `/api/positions/${positionId}/applicants?${query}`,
  });
}

export async function fetchPotentialPositionApplicantsPage(
  input: FetchPotentialPositionApplicantsPageInput,
  fetcher: PositionApplicantFetch = fetch,
) {
  const { positionId, ...queryInput } = input;
  const query = buildPotentialPositionApplicantsQuery(queryInput);
  return fetchPositionApplicantsPageResult({
    errorMessage: 'Failed to fetch potential Applicants',
    fetcher,
    url: `/api/positions/${positionId}/job-matches?${query}`,
  });
}

async function fetchPositionApplicantsPageResult({
  errorMessage,
  fetcher,
  url,
}: {
  errorMessage: string;
  fetcher: PositionApplicantFetch;
  url: string;
}) {
  const response = await fetcher(url);
  if (!response.ok) {
    throw new Error(errorMessage);
  }

  return normalizePositionApplicantsPageResponse(await readJsonOrFallback<unknown>(response, {}));
}
