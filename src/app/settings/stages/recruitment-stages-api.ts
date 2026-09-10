import type { RecruitmentStage } from '@/lib/types';
import {
  getJsonErrorMessage,
  getJsonString,
  readJsonObject,
  readJsonOrFallback,
} from '../../../lib/response-json';
import type { RecruitmentStageFormValues } from './RecruitmentStagesPageView';

export async function fetchRecruitmentStages(): Promise<RecruitmentStage[]> {
  const response = await fetch('/api/settings/recruitment-stages');

  if (!response.ok) {
    throw new Error(await readApiErrorMessage(
      response,
      `Failed to fetch stages. Status: ${response.status}`
    ));
  }

  return readJsonOrFallback<RecruitmentStage[]>(response, []);
}

export async function fetchShowLogoOnlySetting() {
  const response = await fetch('/api/settings/system-settings?keys=showLogoOnly');

  if (!response.ok) {
    return false;
  }

  const data = await readJsonObject(response);
  return getJsonString(data, 'showLogoOnly') === 'true' || data.showLogoOnly === true;
}

export async function saveRecruitmentStage(
  stageId: string | null,
  data: RecruitmentStageFormValues
) {
  const response = await fetch(
    stageId ? `/api/settings/recruitment-stages/${stageId}` : '/api/settings/recruitment-stages',
    {
      method: stageId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response, 'Failed to save stage'));
  }
}

export async function deleteRecruitmentStage(stageId: string) {
  const response = await fetch(`/api/settings/recruitment-stages/${stageId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });

  return {
    ok: response.ok,
    status: response.status,
    message: response.ok ? null : await readApiErrorMessage(response, 'Failed to delete stage'),
  };
}

export async function migrateRecruitmentStage(stageId: string, replacementStageName: string) {
  const response = await fetch(`/api/settings/recruitment-stages/${stageId}/migrate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ replacementStageName }),
  });

  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response, 'Failed to migrate stage data'));
  }
}

export async function reorderRecruitmentStageIds(stageIds: string[]) {
  const response = await fetch('/api/settings/recruitment-stages/reorder', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stageIds }),
  });

  if (!response.ok) {
    throw new Error('Failed to update stage order');
  }
}

async function readApiErrorMessage(response: Response, fallback: string) {
  return getJsonErrorMessage(await readJsonObject(response), response.statusText || fallback);
}
