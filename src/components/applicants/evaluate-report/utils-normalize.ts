import type {
    EvaluationGroupConfig,
    EvaluationInterviewer,
    EvaluationRecord,
} from './types';

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord => (
    typeof value === 'object' && value !== null
);

const isEvaluationRecord = (value: unknown): value is EvaluationRecord => isRecord(value);

export const normalizeEvaluationRecords = (value: unknown): EvaluationRecord[] => (
    Array.isArray(value) ? value.filter(isEvaluationRecord) : []
);

const isEvaluationInterviewer = (value: unknown): value is EvaluationInterviewer => (
    isRecord(value) && typeof value.userId === 'string'
);

export const normalizeInterviewers = (value: unknown): EvaluationInterviewer[] => (
    Array.isArray(value) ? value.filter(isEvaluationInterviewer) : []
);

const toEvaluationGroupConfig = (value: unknown): EvaluationGroupConfig | null => {
    if (!isRecord(value) || typeof value.name !== 'string') {
        return null;
    }

    return {
        name: value.name,
        sortOrder: typeof value.sortOrder === 'number' ? value.sortOrder : null,
    };
};

export const normalizeEvaluationGroupConfigs = (value: unknown): EvaluationGroupConfig[] => {
    const groups = isRecord(value) && Array.isArray(value.groups) ? value.groups : [];

    return groups
        .map(toEvaluationGroupConfig)
        .filter((group): group is EvaluationGroupConfig => group !== null)
        .sort((a, b) => {
            const sortDiff = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
            return sortDiff !== 0 ? sortDiff : a.name.localeCompare(b.name);
        });
};
