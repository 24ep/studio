import { describe, expect, it } from 'vitest';
import { CONTRACT_REFERENCE_DATE, enrichContracts, previewContractEmployees } from './contract-monitoring-utils';

describe('contract monitoring view model', () => {
  it('excludes full-time employees from contract monitoring', () => {
    const contracts = enrichContracts([
      ...previewContractEmployees.slice(0, 1),
      { id: 'full-time', employeeNumber: 'EMP-1', firstName: 'Full', lastName: 'Time', employmentType: 'full_time' },
    ], CONTRACT_REFERENCE_DATE);
    expect(contracts).toHaveLength(1);
  });

  it('matches the preview monitoring summary', () => {
    const contracts = enrichContracts(previewContractEmployees, CONTRACT_REFERENCE_DATE);
    expect(contracts.filter(contract => contract.expiry.state === 'due')).toHaveLength(7);
    expect(contracts.filter(contract => contract.expiry.state === 'expired')).toHaveLength(2);
    expect(contracts.filter(contract => contract.expiry.state === 'missing_end_date')).toHaveLength(3);
    expect(contracts.filter(contract => ['due', 'expired', 'missing_end_date'].includes(contract.expiry.state))).toHaveLength(12);
  });

  it('sorts missing and earliest end dates first', () => {
    const contracts = enrichContracts(previewContractEmployees, CONTRACT_REFERENCE_DATE);
    expect(contracts[0].endDate).toBeNull();
    expect(contracts[3].endDate).toBe('2026-07-20');
  });

  it('derives ownership and completion from live manager and document records', () => {
    const employee = { ...previewContractEmployees[0], managerName: null };
    const [contract] = enrichContracts([employee], CONTRACT_REFERENCE_DATE, [
      { id: 'document-1', employeeId: employee.id, type: 'contract', status: 'complete' },
      { id: 'document-2', employeeId: employee.id, type: 'identity', status: 'pending' },
      { id: 'document-3', employeeId: employee.id, type: 'other', status: 'archived' },
    ]);

    expect(contract.owner).toBe('Unassigned');
    expect(contract.signedContractComplete).toBe(true);
    expect(contract.completedDocumentCount).toBe(1);
    expect(contract.documentCount).toBe(2);
    expect(contract.documentProgress).toBe(50);
  });
});
