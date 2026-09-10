import { describe, expect, it } from 'vitest';

import {
  EMPTY_FILTERS,
  formatBytes,
  getApplicantFilterCount,
  getRecordsLabel,
  getTransferDomainCount,
  isSystemTransferModel,
} from './DataOperationsModel';
import { DATA_OPERATION_MODELS } from './data-operations-api';

describe('DataOperationsModel', () => {
  it('recognizes system transfer models', () => {
    expect(isSystemTransferModel('system-transfer')).toBe(true);
    expect(isSystemTransferModel('system-transfer:people')).toBe(true);
    expect(isSystemTransferModel('applicants')).toBe(false);
  });

  it('counts only active applicant filters and selected transfer domains', () => {
    expect(getApplicantFilterCount({ ...EMPTY_FILTERS, name: 'Anan', email: 'company.com' })).toBe(2);
    expect(getTransferDomainCount({ ...EMPTY_FILTERS, transferDomains: 'people,payroll' })).toBe(2);
  });

  it('describes record scope without changing queue semantics', () => {
    const applicants = DATA_OPERATION_MODELS.find(model => model.id === 'applicants')!;
    const positions = DATA_OPERATION_MODELS.find(model => model.id === 'positions')!;
    expect(getRecordsLabel(applicants, EMPTY_FILTERS)).toBe('All applicants');
    expect(getRecordsLabel(applicants, { ...EMPTY_FILTERS, name: 'Anan' })).toBe('1 filters applied');
    expect(getRecordsLabel(positions, EMPTY_FILTERS)).toBe('All positions');
  });

  it('formats upload sizes consistently', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2.0 KB');
    expect(formatBytes(2 * 1024 * 1024)).toBe('2.0 MB');
  });
});
