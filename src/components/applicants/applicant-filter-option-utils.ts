import type { ApplicantSource, Position, RecruitmentStage, UserProfile } from '../../lib/types';

export const SKILL_OPTIONS = [
  'React', 'Python', 'AWS', 'Java', 'SQL', 'JavaScript', 'TypeScript', 'Node.js', 'Docker', 'Kubernetes', 'C#', 'C++', 'Go', 'Ruby', 'PHP', 'HTML', 'CSS', 'Angular', 'Vue', 'Swift', 'Objective-C', 'Scala', 'Perl', 'R', 'MATLAB', 'Azure', 'GCP', 'Linux', 'Windows', 'iOS', 'Android', 'Flutter', 'Spring', 'Django', 'Flask', 'Express', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'GraphQL', 'REST', 'SOAP', 'Jenkins', 'CI/CD', 'Terraform', 'Ansible', 'Puppet', 'Figma', 'Sketch', 'Zeplin', 'Jira', 'Confluence', 'Salesforce', 'SAP', 'PowerBI', 'Tableau', 'Excel', 'Other'
];

export type ApplicantFilterOption = {
  id: string;
  label: string;
};

export function toApplicantStageOptions(
  stages: Array<Pick<RecruitmentStage, 'id' | 'name'>> | null | undefined
): ApplicantFilterOption[] {
  return (Array.isArray(stages) ? stages : []).map(stage => ({
    id: stage.id,
    label: stage.name,
  }));
}

export function toApplicantPositionOptions(
  positions: Array<Pick<Position, 'id' | 'title'>> | null | undefined
): ApplicantFilterOption[] {
  return (Array.isArray(positions) ? positions : []).map(position => ({
    id: position.id,
    label: position.title,
  }));
}

export function toApplicantRecruiterOptions(
  recruiters: Array<Pick<UserProfile, 'id' | 'name'>> | null | undefined
): ApplicantFilterOption[] {
  return (Array.isArray(recruiters) ? recruiters : []).map(recruiter => ({
    id: recruiter.id,
    label: recruiter.name,
  }));
}

export function toApplicantSourceOptions(
  sources: Array<Pick<ApplicantSource, 'id' | 'name'>> | null | undefined
): ApplicantFilterOption[] {
  return (Array.isArray(sources) ? sources : []).map(source => ({
    id: source.id,
    label: source.name,
  }));
}

export function getVisibleApplicantFilterOptions(
  options: ApplicantFilterOption[],
  isExpanded: boolean,
  maxVisible = 5
) {
  const visibleOptions = isExpanded ? options : options.slice(0, maxVisible);
  const remainingCount = Math.max(options.length - maxVisible, 0);

  return {
    visibleOptions,
    hasMore: remainingCount > 0,
    remainingCount,
  };
}

export function parseApplicantSkillTokens(value: string) {
  return value
    .split(',')
    .map(skill => skill.trim())
    .filter(Boolean);
}

export function createApplicantSkillsSet(value?: string | null) {
  return new Set((value || '').split(',').filter(Boolean));
}

export function addApplicantSkill(skills: Set<string>, skill: string) {
  const trimmedSkill = skill.trim();
  if (!trimmedSkill || skills.has(trimmedSkill)) {
    return { skills, changed: false };
  }

  return {
    skills: new Set([...skills, trimmedSkill]),
    changed: true,
  };
}

export function removeApplicantSkill(skills: Set<string>, skill: string) {
  if (!skills.has(skill)) {
    return { skills, changed: false };
  }

  const nextSkills = new Set(skills);
  nextSkills.delete(skill);

  return { skills: nextSkills, changed: true };
}

export function removeLastApplicantSkill(skills: Set<string>) {
  if (skills.size === 0) {
    return { skills, changed: false };
  }

  const nextSkills = new Set(skills);
  const lastSkill = Array.from(nextSkills).at(-1);
  if (lastSkill) {
    nextSkills.delete(lastSkill);
  }

  return { skills: nextSkills, changed: Boolean(lastSkill) };
}

export function mergeApplicantSkillsFromText(skills: Set<string>, text: string) {
  const nextSkills = new Set(skills);
  let changed = false;

  for (const skill of parseApplicantSkillTokens(text)) {
    if (!nextSkills.has(skill)) {
      nextSkills.add(skill);
      changed = true;
    }
  }

  return { skills: changed ? nextSkills : skills, changed };
}
