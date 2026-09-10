import { readJsonOrFallback } from '@/lib/response-json';
import type {
  ExpertiseGroup,
  ExpertiseSkill,
  PersonalityGroup,
  PersonalityTrait,
  SkillTemplate,
  SkillTemplateFormData,
} from './skill-templates-utils';

export const fallbackExpertiseGroups: ExpertiseGroup[] = [
  { id: '1', name: 'Frontend Development', description: 'Frontend skills', color: '#3B82F6', isActive: true },
  { id: '2', name: 'Backend Development', description: 'Backend skills', color: '#10B981', isActive: true },
];

export const fallbackExpertiseSkills: ExpertiseSkill[] = [
  { id: '1', name: 'React', description: 'React framework', skillType: 'technical', groupId: '1', isActive: true },
  { id: '2', name: 'Node.js', description: 'Node.js runtime', skillType: 'technical', groupId: '2', isActive: true },
];

export const fallbackPersonalityGroups: PersonalityGroup[] = [
  { id: '1', name: 'Communication', description: 'Communication skills', color: '#F59E0B', isActive: true },
  { id: '2', name: 'Leadership', description: 'Leadership skills', color: '#EF4444', isActive: true },
];

export const fallbackPersonalityTraits: PersonalityTrait[] = [
  { id: '1', name: 'Team Player', description: 'Works well in teams', groupId: '1', isActive: true },
  { id: '2', name: 'Confident', description: 'Shows confidence', groupId: '2', isActive: true },
];

export type SkillTemplatesData = {
  groups: ExpertiseGroup[];
  personalityGroups: PersonalityGroup[];
  personalityTraits: PersonalityTrait[];
  skills: ExpertiseSkill[];
  templates: SkillTemplate[];
};

type SkillTemplatesEndpoint<Data> = {
  fallback: Data;
  label: string;
  url: string;
};

export async function fetchSkillTemplatesData(): Promise<SkillTemplatesData> {
  const [templates, groups, skills, personalityGroups, personalityTraits] = await Promise.all([
    fetchSkillTemplateEndpoint<SkillTemplate[]>({
      url: '/api/v1/evaluation/skill-templates',
      label: 'templates',
      fallback: [],
    }),
    fetchSkillTemplateEndpoint({
      url: '/api/v1/evaluation/expertise-groups',
      label: 'groups',
      fallback: fallbackExpertiseGroups,
    }),
    fetchSkillTemplateEndpoint({
      url: '/api/v1/evaluation/expertise-skills',
      label: 'skills',
      fallback: fallbackExpertiseSkills,
    }),
    fetchSkillTemplateEndpoint({
      url: '/api/v1/evaluation/personality-groups',
      label: 'personality groups',
      fallback: fallbackPersonalityGroups,
    }),
    fetchSkillTemplateEndpoint({
      url: '/api/v1/evaluation/personality-traits',
      label: 'personality traits',
      fallback: fallbackPersonalityTraits,
    }),
  ]);

  return { groups, personalityGroups, personalityTraits, skills, templates };
}

export async function createSkillTemplate(formData: SkillTemplateFormData) {
  return submitSkillTemplate('/api/v1/evaluation/skill-templates', 'POST', formData, 'Failed to create skill template');
}

export async function updateSkillTemplate(templateId: string, formData: SkillTemplateFormData) {
  return submitSkillTemplate(
    `/api/v1/evaluation/skill-templates/${templateId}`,
    'PUT',
    formData,
    'Failed to update template'
  );
}

export async function deleteSkillTemplate(templateId: string) {
  const response = await fetch(`/api/v1/evaluation/skill-templates/${templateId}`, { method: 'DELETE' });
  return parseMutationResponse(response, 'Failed to delete template');
}

async function submitSkillTemplate(
  url: string,
  method: 'POST' | 'PUT',
  formData: SkillTemplateFormData,
  fallbackError: string
) {
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData),
  });

  return parseMutationResponse(response, fallbackError);
}

async function parseMutationResponse(response: Response, fallbackError: string) {
  if (response.ok) {
    return { ok: true as const };
  }

  const errorData = await readJsonOrFallback<{ error?: string }>(response, { error: fallbackError });
  const message = errorData.error || `${fallbackError}: ${response.status} ${response.statusText}`;
  return { errorData, message, ok: false as const };
}

async function fetchSkillTemplateEndpoint<Data>(endpoint: SkillTemplatesEndpoint<Data>): Promise<Data> {
  const response = await fetch(endpoint.url);

  if (response.ok) {
    return await readJsonOrFallback<Data>(response, endpoint.fallback);
  }

  console.error(`Failed to fetch ${endpoint.label}:`, response.status);
  return endpoint.fallback;
}
