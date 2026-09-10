import {
  fetchPositionWithCustomAttributes,
  removePositionEvaluationItem,
} from "./evaluation-config-api-request";

async function addPositionEvaluationItems(
  positionId: string,
  itemIds: string[],
  url: string,
  payloadKey: "skillId" | "traitId",
  failureMessage: string,
) {
  const responses = await Promise.all(itemIds.map(itemId =>
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [payloadKey]: itemId }),
    })
  ));

  if (responses.some(response => !response.ok)) {
    throw new Error(failureMessage);
  }
}

export async function addPositionExpertiseSkills(positionId: string, skillIds: string[]) {
  await addPositionEvaluationItems(
    positionId,
    skillIds,
    `/api/positions/${positionId}/expertise-skills`,
    "skillId",
    "Some skills failed to add",
  );
}

export async function addPositionPersonalityTraits(positionId: string, traitIds: string[]) {
  await addPositionEvaluationItems(
    positionId,
    traitIds,
    `/api/positions/${positionId}/personality-traits`,
    "traitId",
    "Some traits failed to add",
  );
}

export async function removePositionExpertiseSkill(positionId: string, assignmentId: string) {
  await removePositionEvaluationItem(
    `/api/positions/${positionId}/expertise-skills/${assignmentId}`,
    "Failed to remove expertise skill",
  );
}

export async function removePositionPersonalityTrait(positionId: string, assignmentId: string) {
  await removePositionEvaluationItem(
    `/api/positions/${positionId}/personality-traits/${assignmentId}`,
    "Failed to remove personality trait",
  );
}

export async function savePositionEvaluationTemplateId(positionId: string, templateId: string | null) {
  const position = await fetchPositionWithCustomAttributes(positionId);
  if (!position) {
    return;
  }

  const updatedCustomAttributes = {
    ...(position.custom_attributes || {}),
    evaluationTemplateId: templateId || undefined,
  };

  if (!templateId) {
    delete updatedCustomAttributes.evaluationTemplateId;
  }

  await fetch(`/api/positions/${positionId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ custom_attributes: updatedCustomAttributes }),
  });
}
