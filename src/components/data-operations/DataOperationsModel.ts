import {
  DATA_TRANSFER_DOMAIN_OPTIONS,
  getSystemTransferDomainLabel,
  type DataOperationModel,
  type DataOperationModelId,
} from './data-operations-api';

export interface ApplicantExportFilters {
  name: string;
  email: string;
  applicationDateStart: string;
  applicationDateEnd: string;
  minAppliedJobFitScore: string;
  transferDomains: string;
}

export const EMPTY_FILTERS: ApplicantExportFilters = {
  name: '',
  email: '',
  applicationDateStart: '',
  applicationDateEnd: '',
  minAppliedJobFitScore: '',
  transferDomains: DATA_TRANSFER_DOMAIN_OPTIONS.map(item => item.id).join(','),
};

export const ALL_TRANSFER_DOMAIN_IDS = DATA_TRANSFER_DOMAIN_OPTIONS.map(item => item.id);

export function isSystemTransferModel(value: DataOperationModelId) {
  return value === 'system-transfer' || value.startsWith('system-transfer:');
}

export function getTransferDomainCount(filters: ApplicantExportFilters) {
  return filters.transferDomains.split(',').filter(Boolean).length;
}

export function getApplicantFilterCount(filters: ApplicantExportFilters) {
  return Object.entries(filters).filter(([key, value]) => key !== 'transferDomains' && Boolean(value)).length;
}

export function getRecordsLabel(model: DataOperationModel, filters: ApplicantExportFilters) {
  const activeFilterCount = getApplicantFilterCount(filters);
  if (model.systemTransferDomain) return getSystemTransferDomainLabel(model.systemTransferDomain);
  if (model.id === 'applicants') return activeFilterCount ? `${activeFilterCount} filters applied` : 'All applicants';
  if (model.id === 'positions') return 'All positions';
  if (model.id === 'system-transfer') return `${getTransferDomainCount(filters)} business domains`;
  return 'None';
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
