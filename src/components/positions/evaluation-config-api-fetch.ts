import type {
  EvaluationTemplate,
  ExpertiseGroup,
  ExpertiseSkill,
  PersonalityGroup,
  PersonalityTrait,
  PositionExpertiseSkill,
  PositionPersonalityTrait,
} from "./EvaluationConfigTabParts";
import {
  fetchEvaluationJson,
  fetchOptionalEvaluationJson,
  fetchPositionWithCustomAttributes,
} from "./evaluation-config-api-request";

interface EvaluationExpertiseResponse {
  skills?: ExpertiseSkill[];
  groups?: ExpertiseGroup[];
}

interface EvaluationPersonalityResponse {
  traits?: PersonalityTrait[];
  groups?: PersonalityGroup[];
}

export async function fetchEvaluationExpertise() {
  const data = await fetchEvaluationJson<EvaluationExpertiseResponse>(
    "/api/evaluation/expertise-skills",
    "load expertise skills",
  );

  return {
    skills: data.skills || [],
    groups: data.groups || [],
  };
}

export async function fetchPositionExpertiseSkills(positionId: string) {
  return fetchEvaluationJson<PositionExpertiseSkill[]>(
    `/api/positions/${positionId}/expertise-skills`,
    "load position expertise skills",
  );
}

export async function fetchEvaluationPersonality() {
  const data = await fetchEvaluationJson<EvaluationPersonalityResponse>(
    "/api/evaluation/personality-traits",
    "load personality traits",
  );

  return {
    traits: data.traits || [],
    groups: data.groups || [],
  };
}

export async function fetchPositionPersonalityTraits(positionId: string) {
  return fetchEvaluationJson<PositionPersonalityTrait[]>(
    `/api/positions/${positionId}/personality-traits`,
    "load position personality traits",
  );
}

export async function fetchEvaluationTemplates() {
  const data = await fetchOptionalEvaluationJson<unknown>("/api/v1/evaluation/skill-templates", []);
  return Array.isArray(data) ? data as EvaluationTemplate[] : [];
}

export async function fetchPositionEvaluationTemplateId(positionId: string) {
  const position = await fetchPositionWithCustomAttributes(positionId);
  const savedTemplateId = position?.custom_attributes?.evaluationTemplateId;
  return typeof savedTemplateId === "string" ? savedTemplateId : "";
}
