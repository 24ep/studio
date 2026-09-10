import type { RecruitmentStage } from "@/lib/types";
import { getJsonErrorMessage, readJsonObject, readJsonOrFallback } from "../../../lib/response-json";

import type { RecruitmentStageFormPayload } from "./recruitment-stages-types";

const RECRUITMENT_STAGES_API = "/api/settings/recruitment-stages";
const JSON_HEADERS = { "Content-Type": "application/json" };

async function getErrorMessage(response: Response, fallback: string) {
  return getJsonErrorMessage(await readJsonObject(response), response.statusText || fallback);
}

export async function fetchRecruitmentStages() {
  const response = await fetch(RECRUITMENT_STAGES_API);

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, `Failed to fetch stages. Status: ${response.status}`)
    );
  }

  return readJsonOrFallback<RecruitmentStage[]>(response, []);
}

export async function saveRecruitmentStage(
  stageId: string | null,
  data: RecruitmentStageFormPayload
) {
  const response = await fetch(
    stageId ? `${RECRUITMENT_STAGES_API}/${stageId}` : RECRUITMENT_STAGES_API,
    {
      method: stageId ? "PUT" : "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to save stage"));
  }
}

export async function deleteRecruitmentStage(stageId: string) {
  const response = await fetch(`${RECRUITMENT_STAGES_API}/${stageId}`, {
    method: "DELETE",
    headers: JSON_HEADERS,
  });

  if (response.ok) {
    return { ok: true, status: response.status, message: "" };
  }

  return {
    ok: false,
    status: response.status,
    message: await getErrorMessage(response, "Failed to delete stage"),
  };
}

export async function migrateRecruitmentStage(
  stageId: string,
  replacementStageName: string
) {
  const response = await fetch(`${RECRUITMENT_STAGES_API}/${stageId}/migrate`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ replacementStageName }),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to migrate stage data"));
  }
}

export async function reorderRecruitmentStages(stageIds: string[]) {
  const response = await fetch(`${RECRUITMENT_STAGES_API}/reorder`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ stageIds }),
  });

  if (!response.ok) {
    throw new Error("Failed to update stage order");
  }
}

export async function loadRecruitmentStagesFromAppKit(environment: "development" | "production") {
  const response = await fetch(`${RECRUITMENT_STAGES_API}/import-appkit`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ environment }),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to load recruitment stages from AppKit"));
  }
}
