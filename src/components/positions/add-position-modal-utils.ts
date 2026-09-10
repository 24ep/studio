import type { Grade } from '@/lib/types';

export interface AddPositionRecruiterOption {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface AddPositionDescriptionFields {
  department?: string | null;
  positionLevel?: string | null;
  title?: string | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function normalizeAddPositionRecruiterOptions(value: unknown): AddPositionRecruiterOption[] {
  if (!isRecord(value) || !Array.isArray(value.users)) return [];

  return value.users.filter(isRecord).flatMap((recruiter) => {
    const id = typeof recruiter.id === 'string' ? recruiter.id : '';
    const name = typeof recruiter.name === 'string' ? recruiter.name : '';

    if (!id || !name) return [];

    return [{
      id,
      name,
      avatarUrl: typeof recruiter.avatarUrl === 'string' ? recruiter.avatarUrl : undefined,
    }];
  });
}

export function normalizeAddPositionGrades(value: unknown): Grade[] {
  return Array.isArray(value) ? value.filter(isGrade) : [];
}

export function normalizeDefaultMatchCriteria(value: unknown) {
  if (!isRecord(value)) return '';

  const defaultCriteria = value.defaultMatchCriteria;
  return typeof defaultCriteria === 'string' ? defaultCriteria : '';
}

export function getMissingJobDescriptionFields({
  department,
  positionLevel,
  title,
}: AddPositionDescriptionFields) {
  const missingFields: string[] = [];

  if (!title?.trim()) missingFields.push('Position Title');
  if (!department?.trim()) missingFields.push('Department');
  if (!positionLevel?.trim()) missingFields.push('Position Level');

  return missingFields;
}

export function hasVisibleJobDescription(description: string | null | undefined) {
  if (!description?.trim()) return false;

  const textContent = description
    .replace(/<[^>]*>/g, '')
    .replace(/(?:&nbsp;|&#0*160;|&#x0*a0;)/gi, ' ')
    .replace(/[\s\u00a0\u200b-\u200d\ufeff]/g, '');

  // Preserve the warning for non-text content that replacing would remove.
  return textContent.length > 0 || /<(?:hr|img|video|audio)\b/i.test(description);
}

export function normalizeGeneratedJobDescriptionResponse(value: unknown) {
  if (!isRecord(value)) {
    return {
      description: '',
      error: '',
    };
  }

  return {
    description: typeof value.description === 'string' ? value.description : '',
    error: typeof value.error === 'string' ? value.error : '',
  };
}

function isGrade(value: unknown): value is Grade {
  if (!isRecord(value)) return false;

  return typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.minLevel === 'number' &&
    typeof value.maxLevel === 'number' &&
    typeof value.slaDays === 'number' &&
    typeof value.isActive === 'boolean' &&
    typeof value.sortOrder === 'number';
}
