import type { Applicant, Position } from '../../../lib/types';
import { getJsonErrorMessage, getJsonString, readJsonObject, readJsonOrFallback } from '../../../lib/response-json';
import type {
    AveragedEvaluationData,
    EvaluationGroupConfig,
    EvaluationInterviewer,
    EvaluationRecord,
} from './types';
import {
    buildAveragedEvaluationData,
    buildSingleEvaluationAverage,
    normalizeEvaluationGroupConfigs,
    normalizeEvaluationRecords,
    normalizeInterviewers,
    normalizeReportHeaderPreferences,
    type ReportHeaderPreferences,
} from './utils';

type Fetcher = typeof fetch;

export interface ApplicantReportRecord {
    applicant: Applicant | null;
    position: Position | null;
}

export interface EvaluationReportData {
    averagedEvaluationData: AveragedEvaluationData | null;
    allEvaluations: EvaluationRecord[];
}

export async function loadApplicantReportRecord(
    applicantId: string,
    fetcher: Fetcher = fetch
): Promise<ApplicantReportRecord> {
    const response = await fetcher(`/api/applicants/${applicantId}`, { credentials: 'include' });
    if (!response.ok) {
        return { applicant: null, position: null };
    }

    const applicant = await readJsonOrFallback<Applicant | null>(response, null);
    if (!applicant) {
        return { applicant: null, position: null };
    }

    if (!applicant.positionId) {
        return { applicant, position: null };
    }

    const positionResponse = await fetcher(`/api/positions/${applicant.positionId}`, { credentials: 'include' });
    if (!positionResponse.ok) {
        return { applicant, position: null };
    }

    return {
        applicant,
        position: await readJsonOrFallback<Position | null>(positionResponse, null),
    };
}

export async function loadEvaluationReportData(
    applicantId: string,
    fetcher: Fetcher = fetch
): Promise<EvaluationReportData> {
    const response = await fetcher(`/api/v1/applicants/${applicantId}/evaluations`);
    if (response.ok) {
        const evaluations = normalizeEvaluationRecords(await readJsonOrFallback<unknown>(response, []));

        return {
            averagedEvaluationData: buildAveragedEvaluationData(evaluations),
            allEvaluations: evaluations,
        };
    }

    const fallbackResponse = await fetcher(`/api/v1/applicants/${applicantId}/evaluation`);
    if (fallbackResponse.ok) {
        const data = await readJsonOrFallback<unknown>(fallbackResponse, null);
        const evaluations = normalizeEvaluationRecords([data]);
        const evaluation = evaluations[0] ?? null;

        return {
            averagedEvaluationData: buildSingleEvaluationAverage(evaluation),
            allEvaluations: evaluation ? [evaluation] : [],
        };
    }

    return {
        averagedEvaluationData: null,
        allEvaluations: [],
    };
}

export async function loadEvaluationInterviewers(
    applicantId: string,
    fetcher: Fetcher = fetch
): Promise<EvaluationInterviewer[]> {
    const response = await fetcher(`/api/v1/applicants/${applicantId}/interviewers`, { credentials: 'include' });
    if (!response.ok) {
        return [];
    }

    return normalizeInterviewers(await readJsonOrFallback<unknown>(response, []));
}

export async function loadPersonalityGroupsConfig(fetcher: Fetcher = fetch): Promise<EvaluationGroupConfig[]> {
    const response = await fetcher('/api/evaluation/personality-traits');
    if (!response.ok) {
        return [];
    }

    return normalizeEvaluationGroupConfigs(await readJsonOrFallback<unknown>(response, {}));
}

export async function loadReportHeaderPreferences(fetcher: Fetcher = fetch): Promise<ReportHeaderPreferences | null> {
    const response = await fetcher('/api/settings/system-settings?keys=evaluateReportLogoDataUrl,evaluatePlatformLogoDataUrl,appLogoDataUrl,organizationLogoDataUrl,organizationName,organizationAddress,organizationContact');
    if (!response.ok) {
        return null;
    }

    return normalizeReportHeaderPreferences(await readJsonOrFallback<unknown>(response, {}));
}

export async function uploadEvaluateReportAvatar(
    applicantId: string,
    file: File,
    fetcher: Fetcher = fetch
): Promise<string | null> {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await fetcher(`/api/applicants/${applicantId}/avatar`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
    });

    if (!response.ok) {
        const errorData = await readJsonObject(response);
        throw new Error(getJsonErrorMessage(errorData, 'Failed to update avatar'));
    }

    return getJsonString(await readJsonObject(response), 'avatarUrl') ?? null;
}
