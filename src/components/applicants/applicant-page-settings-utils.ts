import { normalizeSystemSettingsResponse } from '../../lib/system-settings-response';
import type { ApplicantGroupBy, ApplicantSettings } from './applicant-settings-types';

export interface ApplicantPageSettingsViewState {
  pageSize: number;
  sortColumn: string;
  sortDirection: 'asc' | 'desc';
  showPinSection: boolean;
  groupBy: ApplicantGroupBy;
}

export function getApplicantExportImportFeatureEnabled(data: unknown) {
  const settings = normalizeSystemSettingsResponse(data);
  return settings.exportImportFeatureEnabled !== 'false';
}

export function buildApplicantPageSizeSettings<T extends object>(settings: T, pageSize: number) {
  return {
    ...settings,
    pageSize,
  };
}

export function buildApplicantSortSettings<T extends object>(
  settings: T,
  column: string | null,
  direction?: 'asc' | 'desc' | null
) {
  return {
    ...settings,
    sortColumn: column || 'applicationDate',
    sortDirection: direction !== undefined ? direction : 'desc',
  };
}

export function buildApplicantGroupBySettings(settings: ApplicantSettings, groupBy: ApplicantGroupBy) {
  return {
    ...settings,
    groupBy,
  };
}

export function buildApplicantPageSettingsViewState(
  settings: {
    pageSize?: number | null;
    sortColumn?: string | null;
    sortDirection?: 'asc' | 'desc' | null;
    showPinSection?: boolean | null;
    groupBy?: ApplicantGroupBy | null;
  } | null | undefined,
  settingsLoading: boolean
): ApplicantPageSettingsViewState {
  return {
    pageSize: settings?.pageSize || 20,
    sortColumn: settings?.sortColumn || 'applicationDate',
    sortDirection: settings?.sortDirection !== undefined && settings?.sortDirection !== null
      ? settings.sortDirection
      : 'desc',
    showPinSection: settingsLoading ? false : settings?.showPinSection || false,
    groupBy: settings?.groupBy || 'none',
  };
}

export function getApplicantAdvancedQueryParam(searchParams: URLSearchParams) {
  return searchParams.get('query') || undefined;
}
