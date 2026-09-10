import type { EvaluationRecord } from './types';
import type { GroupConfig } from './evaluate-result-grouping-utils';

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord => (
  typeof value === 'object' && value !== null
);

const isEvaluationRecord = (value: unknown): value is EvaluationRecord => isRecord(value);

export const normalizeEvaluationRecords = (value: unknown): EvaluationRecord[] => (
  Array.isArray(value) ? value.filter(isEvaluationRecord) : []
);

const toGroupConfig = (value: unknown): GroupConfig | null => {
  if (!isRecord(value) || typeof value.name !== 'string') {
    return null;
  }

  return {
    name: value.name,
    sortOrder: typeof value.sortOrder === 'number' ? value.sortOrder : undefined,
  };
};

export const normalizeGroupConfigs = (value: unknown): GroupConfig[] => {
  const groups = isRecord(value) && Array.isArray(value.groups) ? value.groups : [];

  return groups
    .map(toGroupConfig)
    .filter((group): group is GroupConfig => group !== null)
    .sort((a, b) => {
      const sortDiff = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
      return sortDiff !== 0 ? sortDiff : (a.name || '').localeCompare(b.name || '');
    });
};

export const normalizeEvaluationRecord = (value: unknown): EvaluationRecord | null => (
  isEvaluationRecord(value) ? value : null
);
