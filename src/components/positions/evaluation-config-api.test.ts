import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  addPositionExpertiseSkills,
  applyEvaluationTemplateTasks,
  fetchEvaluationExpertise,
  getEvaluationTemplateApplyTaskUrl,
  removePositionPersonalityTrait,
  savePositionEvaluationTemplateId,
} from './evaluation-config-api';
import type { EvaluationTemplateApplyTask } from './evaluation-config-utils';

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
    status: init?.status ?? 200,
    statusText: init?.statusText,
  });
}

describe('evaluation-config-api', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('maps template apply tasks to their endpoint urls', () => {
    expect(getEvaluationTemplateApplyTaskUrl('position-1', {
      kind: 'expertise-group',
      id: 'group-1',
      name: 'Frontend',
      payload: {},
      duplicateOkStatus: 400,
    })).toBe('/api/v1/positions/position-1/evaluation/expertise-groups');

    expect(getEvaluationTemplateApplyTaskUrl('position-1', {
      kind: 'personality-trait',
      id: 'trait-1',
      name: 'Ownership',
      payload: {},
      duplicateOkStatus: 409,
    })).toBe('/api/positions/position-1/personality-traits');
  });

  it('loads evaluation expertise data with empty-array fallbacks', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({}));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchEvaluationExpertise()).resolves.toEqual({
      skills: [],
      groups: [],
    });
    expect(fetchMock).toHaveBeenCalledWith('/api/evaluation/expertise-skills');
  });

  it('posts selected expertise skills and fails if any request fails', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({}))
      .mockResolvedValueOnce(jsonResponse({}, { status: 500, statusText: 'Server Error' }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(addPositionExpertiseSkills('position-1', ['skill-1', 'skill-2']))
      .rejects.toThrow('Some skills failed to add');
    expect(fetchMock.mock.calls.map(call => [call[0], JSON.parse(String(call[1]?.body))])).toEqual([
      ['/api/positions/position-1/expertise-skills', { skillId: 'skill-1' }],
      ['/api/positions/position-1/expertise-skills', { skillId: 'skill-2' }],
    ]);
  });

  it('uses API error text when removing a personality trait fails', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ message: 'Trait is locked' }, { status: 409 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(removePositionPersonalityTrait('position-1', 'assignment-1'))
      .rejects.toThrow('Trait is locked');
    expect(fetchMock).toHaveBeenCalledWith('/api/positions/position-1/personality-traits/assignment-1', {
      method: 'DELETE',
      credentials: 'include',
    });
  });

  it('saves and clears evaluation template ids while preserving custom attributes', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ custom_attributes: { existing: true, evaluationTemplateId: 'old' } }))
      .mockResolvedValueOnce(jsonResponse({}))
      .mockResolvedValueOnce(jsonResponse({ custom_attributes: { existing: true, evaluationTemplateId: 'new' } }))
      .mockResolvedValueOnce(jsonResponse({}));
    vi.stubGlobal('fetch', fetchMock);

    await savePositionEvaluationTemplateId('position-1', 'new');
    await savePositionEvaluationTemplateId('position-1', null);

    expect(JSON.parse(String(fetchMock.mock.calls[1][1]?.body))).toEqual({
      custom_attributes: { existing: true, evaluationTemplateId: 'new' },
    });
    expect(JSON.parse(String(fetchMock.mock.calls[3][1]?.body))).toEqual({
      custom_attributes: { existing: true },
    });
  });

  it('applies template tasks and treats duplicate statuses as success', async () => {
    const tasks: EvaluationTemplateApplyTask[] = [
      {
        kind: 'expertise-skill',
        id: 'skill-1',
        name: 'React',
        payload: { skillId: 'skill-1' },
        duplicateOkStatus: 409,
      },
    ];
    const fetchMock = vi.fn(async () => jsonResponse({}, { status: 409 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(applyEvaluationTemplateTasks('position-1', tasks)).resolves.toEqual([
      { ok: true, status: 409, id: 'skill-1', name: 'React' },
    ]);
  });
});
