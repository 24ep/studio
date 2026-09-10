import type {
  ExpertiseGroup,
  ExpertiseGroupFormData,
  ExpertiseSkill,
  ExpertiseSkillCreateFormData,
} from "./ExpertiseGroupsTabTypes";
import { getJsonErrorMessage, readJsonObject, readJsonOrFallback } from "../../lib/response-json";

async function readErrorMessage(response: Response, fallback: string) {
  return getJsonErrorMessage(await readJsonObject(response), fallback);
}

async function fetchJsonOrThrow<T>(url: string, fallback: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, fallback));
  }

  return readJsonOrFallback<T>(response, [] as T);
}

async function writeOrThrow(url: string, init: RequestInit, fallback: string) {
  const response = await fetch(url, init);

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, fallback));
  }
}

export function fetchExpertiseGroups() {
  return fetchJsonOrThrow<ExpertiseGroup[]>(
    "/api/v1/evaluation/expertise-groups",
    "Failed to fetch expertise groups",
  );
}

export function fetchExpertiseSkills() {
  return fetchJsonOrThrow<ExpertiseSkill[]>(
    "/api/v1/evaluation/expertise-skills",
    "Failed to fetch expertise skills",
  );
}

export function createExpertiseGroup(formData: ExpertiseGroupFormData) {
  return writeOrThrow(
    "/api/v1/evaluation/expertise-groups",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    },
    "Failed to create expertise group",
  );
}

export function updateExpertiseGroup(groupId: string, formData: ExpertiseGroupFormData) {
  return writeOrThrow(
    `/api/v1/evaluation/expertise-groups/${groupId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    },
    "Failed to update expertise group",
  );
}

export function deleteExpertiseGroup(groupId: string) {
  return writeOrThrow(
    `/api/v1/evaluation/expertise-groups/${groupId}`,
    {
      method: "DELETE",
    },
    "Failed to delete expertise group",
  );
}

export function createExpertiseSkillForGroup(
  groupId: string,
  skillFormData: ExpertiseSkillCreateFormData,
) {
  return writeOrThrow(
    "/api/v1/evaluation/expertise-skills",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...skillFormData,
        groupId,
      }),
    },
    "Failed to add skill to group",
  );
}

export function removeExpertiseSkillFromGroup(skillId: string) {
  return writeOrThrow(
    `/api/v1/evaluation/expertise-skills/${skillId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId: null }),
    },
    "Failed to remove skill from group",
  );
}
