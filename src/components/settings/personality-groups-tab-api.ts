import {
  getJsonErrorMessage,
  readJsonObject,
  readJsonOrFallback,
} from '@/lib/response-json';
import type {
  PersonalityGroup,
  PersonalityGroupFormData,
  PersonalityTrait,
  PersonalityTraitCreateFormData,
} from './PersonalityGroupsTabTypes';

const PERSONALITY_GROUPS_ENDPOINT = "/api/v1/evaluation/personality-groups";
const PERSONALITY_TRAITS_ENDPOINT = "/api/v1/evaluation/personality-traits";

async function readPersonalityError(response: Response, fallback: string) {
  return getJsonErrorMessage(await readJsonObject(response), fallback);
}

export async function fetchPersonalityGroups() {
  const response = await fetch(PERSONALITY_GROUPS_ENDPOINT);
  if (!response.ok) {
    throw new Error("Failed to fetch personality groups");
  }

  return readJsonOrFallback<PersonalityGroup[]>(response, []);
}

export async function fetchPersonalityTraits() {
  const response = await fetch(PERSONALITY_TRAITS_ENDPOINT);
  if (!response.ok) {
    throw new Error("Failed to fetch personality traits");
  }

  return readJsonOrFallback<PersonalityTrait[]>(response, []);
}

export async function createPersonalityGroup(formData: PersonalityGroupFormData) {
  const response = await fetch(PERSONALITY_GROUPS_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData),
  });

  if (!response.ok) {
    throw new Error(await readPersonalityError(response, "Failed to create personality group"));
  }
}

export async function updatePersonalityGroup(groupId: string, formData: PersonalityGroupFormData) {
  const response = await fetch(`${PERSONALITY_GROUPS_ENDPOINT}/${groupId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData),
  });

  if (!response.ok) {
    throw new Error(await readPersonalityError(response, "Failed to update personality group"));
  }
}

export async function deletePersonalityGroup(groupId: string) {
  const response = await fetch(`${PERSONALITY_GROUPS_ENDPOINT}/${groupId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(await readPersonalityError(response, "Failed to delete personality group"));
  }
}

export async function addPersonalityTraitToGroup(
  groupId: string,
  traitFormData: PersonalityTraitCreateFormData,
) {
  const response = await fetch(PERSONALITY_TRAITS_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...traitFormData,
      groupId,
    }),
  });

  if (!response.ok) {
    throw new Error(await readPersonalityError(response, "Failed to add trait to group"));
  }
}

export async function removePersonalityTraitFromGroup(traitId: string) {
  const response = await fetch(`${PERSONALITY_TRAITS_ENDPOINT}/${traitId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ groupId: null }),
  });

  if (!response.ok) {
    throw new Error(await readPersonalityError(response, "Failed to remove trait from group"));
  }
}
