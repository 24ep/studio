import type { CustomFieldDefinition, Headcount, HeadcountType } from '@/lib/types';
import { fetchCustomFieldsForSection } from '@/lib/customFieldUtils';
import { readJsonObject, readJsonOrFallback } from '@/lib/response-json';
import type { HeadcountModalSaveData } from '../HeadcountModalTypes';
import type { HeadcountSLAData, HeadcountTypeOption } from './use-headcount-tab-data';

export const FALLBACK_HEADCOUNT_TYPE_OPTIONS: HeadcountTypeOption[] = [
  { value: 'promote' as HeadcountType, label: 'Promote', color: 'bg-primary/10 text-primary' },
  { value: 'new' as HeadcountType, label: 'New', color: 'bg-green-100 text-green-800' },
  { value: 'replace' as HeadcountType, label: 'Replace', color: 'bg-orange-100 text-orange-800' },
];

export async function fetchHeadcountTypeOptions(): Promise<HeadcountTypeOption[] | null> {
  const response = await fetch('/api/settings/headcount-types');

  if (!response.ok) {
    return null;
  }

  return normalizeHeadcountTypeOptions(await readJsonOrFallback<unknown>(response, []));
}

export async function fetchHeadcountCustomFields(): Promise<CustomFieldDefinition[]> {
  return fetchCustomFieldsForSection('Headcount', 'headcount-detail');
}

export async function fetchHeadcountsForPosition(positionId: string): Promise<Headcount[]> {
  const response = await fetch(`/api/headcount?positionId=${positionId}`);

  if (!response.ok) {
    throw new Error('Failed to fetch headcounts');
  }

  return normalizeHeadcounts(await readJsonOrFallback<unknown>(response, []));
}

export async function fetchHeadcountSLAById(headcountId: string): Promise<HeadcountSLAData> {
  try {
    const response = await fetch(`/api/headcount/${headcountId}/sla`);

    if (response.ok) {
      return normalizeHeadcountSLAData(await readJsonObject(response));
    }

    console.error(`Failed to fetch SLA for headcount ${headcountId}:`, response.status, response.statusText);
    return { error: `HTTP ${response.status}` };
  } catch (error) {
    console.error(`Error fetching SLA for headcount ${headcountId}:`, error);
    return { error: 'Network error' };
  }
}

function normalizeHeadcountTypeOptions(value: unknown): HeadcountTypeOption[] {
  return Array.isArray(value) ? value.filter(isHeadcountTypeOption) : [];
}

function normalizeHeadcounts(value: unknown): Headcount[] {
  return Array.isArray(value) ? value.filter(isHeadcount) : [];
}

function normalizeHeadcountSLAData(value: Record<string, unknown>): HeadcountSLAData {
  const violation = value.violation && typeof value.violation === 'object' && !Array.isArray(value.violation)
    ? value.violation as HeadcountSLAData['violation']
    : null;

  return {
    violation,
    remainingDays: typeof value.remainingDays === 'number' ? value.remainingDays : null,
    error: typeof value.error === 'string' ? value.error : undefined,
  };
}

function isHeadcountTypeOption(value: unknown): value is HeadcountTypeOption {
  return Boolean(
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    typeof (value as HeadcountTypeOption).value === 'string' &&
    typeof (value as HeadcountTypeOption).label === 'string'
  );
}

function isHeadcount(value: unknown): value is Headcount {
  return Boolean(
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    typeof (value as Headcount).id === 'string'
  );
}

export async function fetchHeadcountSLAForItems(
  headcounts: Headcount[]
): Promise<Record<string, HeadcountSLAData>> {
  const slaEntries = await Promise.all(
    headcounts.map(async (headcount) => [
      headcount.id,
      await fetchHeadcountSLAById(headcount.id),
    ] as const)
  );

  return Object.fromEntries(slaEntries);
}

export async function deleteHeadcountById(headcountId: string): Promise<void> {
  const response = await fetch(`/api/headcount/${headcountId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete headcount');
  }
}

export async function saveHeadcountForPosition({
  editingHeadcount,
  headcountData,
  positionId,
}: {
  editingHeadcount: Headcount | null;
  headcountData: HeadcountModalSaveData;
  positionId: string;
}): Promise<void> {
  const url = editingHeadcount
    ? `/api/headcount/${editingHeadcount.id}`
    : '/api/headcount';

  const method = editingHeadcount ? 'PUT' : 'POST';

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...headcountData,
      positionId,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to save headcount');
  }
}
