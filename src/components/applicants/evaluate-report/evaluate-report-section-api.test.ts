import { describe, expect, it, vi } from 'vitest';

import {
    loadApplicantReportRecord,
    loadEvaluationReportData,
    loadReportHeaderPreferences,
} from './evaluate-report-section-api';

function jsonResponse(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}

function responseSequence(responses: Response[]): typeof fetch {
    const fetcher = vi.fn(async () => {
        const response = responses.shift();
        return response ?? jsonResponse({ error: 'missing mock response' }, 500);
    });

    return fetcher as unknown as typeof fetch;
}

describe('evaluate report section API helpers', () => {
    it('loads applicant and position records together when a position is assigned', async () => {
        const fetcher = responseSequence([
            jsonResponse({
                id: 'applicant-1',
                name: 'Jane Candidate',
                email: 'jane@example.com',
                positionId: 'position-1',
            }),
            jsonResponse({
                id: 'position-1',
                title: 'Frontend Engineer',
            }),
        ]);

        await expect(loadApplicantReportRecord('applicant-1', fetcher)).resolves.toMatchObject({
            applicant: { id: 'applicant-1', positionId: 'position-1' },
            position: { id: 'position-1', title: 'Frontend Engineer' },
        });
        expect(fetcher).toHaveBeenCalledTimes(2);
    });

    it('builds averaged report data from the plural evaluations endpoint', async () => {
        const fetcher = responseSequence([
            jsonResponse([
                {
                    id: 'evaluation-1',
                    overallScore: 80,
                    evaluator: { id: 'user-1' },
                    personalityScores: [],
                    expertiseScores: [],
                },
                null,
            ]),
        ]);

        await expect(loadEvaluationReportData('applicant-1', fetcher)).resolves.toMatchObject({
            averagedEvaluationData: {
                overallScore: 80,
                evaluatorCount: 1,
            },
            allEvaluations: [{ id: 'evaluation-1' }],
        });
        expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it('falls back to the singular evaluation endpoint when plural evaluations fail', async () => {
        const fetcher = responseSequence([
            jsonResponse({ error: 'not found' }, 404),
            jsonResponse({
                id: 'evaluation-1',
                overallScore: 72,
                evaluator: { id: 'user-1' },
                personalityScores: [],
                expertiseScores: [],
            }),
        ]);

        await expect(loadEvaluationReportData('applicant-1', fetcher)).resolves.toMatchObject({
            averagedEvaluationData: {
                overallScore: 72,
                evaluatorCount: 1,
            },
            allEvaluations: [{ id: 'evaluation-1' }],
        });
        expect(fetcher).toHaveBeenCalledTimes(2);
    });

    it('returns empty evaluation state when both evaluation endpoints fail', async () => {
        const fetcher = responseSequence([
            jsonResponse({ error: 'not found' }, 404),
            jsonResponse({ error: 'not found' }, 404),
        ]);

        await expect(loadEvaluationReportData('applicant-1', fetcher)).resolves.toEqual({
            averagedEvaluationData: null,
            allEvaluations: [],
        });
    });

    it('loads optional report header settings', async () => {
        const fetcher = responseSequence([
            jsonResponse({
                settings: [
                    { key: 'evaluateReportLogoDataUrl', value: 'report-logo' },
                    { key: 'organizationName', value: 'Acme' },
                ],
            }),
        ]);

        await expect(loadReportHeaderPreferences(fetcher)).resolves.toMatchObject({
            appLogoUrl: 'report-logo',
            organizationName: 'Acme',
        });
    });
});
