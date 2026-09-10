import { describe, expect, it } from 'vitest';

import {
  JOB_APPLIED_EMPTY_SELECT_VALUE,
  formatJobAppliedExpectedSalary,
  fromJobAppliedSelectValue,
  getAppliedPosition,
  getInitialJobAppliedEditState,
  getJobAppliedAssignments,
  getNonEmptyJobAppliedJustifications,
  getJobAppliedJustificationTone,
  parseExpectedSalaryInput,
  runJobAppliedDialogUpdate,
  toJobAppliedSelectValue,
  toNullableJobAppliedId,
} from './job-applied-tab-utils';
import type { Applicant, Position } from '@/lib/types';

describe('job applied tab utils', () => {
  it('maps optional select values through a non-empty sentinel', () => {
    expect(toJobAppliedSelectValue('')).toBe(JOB_APPLIED_EMPTY_SELECT_VALUE);
    expect(toJobAppliedSelectValue(null)).toBe(JOB_APPLIED_EMPTY_SELECT_VALUE);
    expect(toJobAppliedSelectValue('user-1')).toBe('user-1');
    expect(fromJobAppliedSelectValue(JOB_APPLIED_EMPTY_SELECT_VALUE)).toBe('');
    expect(fromJobAppliedSelectValue('source-1')).toBe('source-1');
    expect(toNullableJobAppliedId('')).toBeNull();
    expect(toNullableJobAppliedId('source-1')).toBe('source-1');
  });

  it('parses expected salary inputs for API payloads', () => {
    expect(parseExpectedSalaryInput('50000')).toBe(50000);
    expect(parseExpectedSalaryInput(' 50000.50 ')).toBe(50000.5);
    expect(parseExpectedSalaryInput('')).toBeNull();
    expect(parseExpectedSalaryInput('not-a-number')).toBeNull();
  });

  it('finds the applied position safely', () => {
    const positions = [
      { id: 'position-1', title: 'Engineer' },
      { id: 'position-2', title: 'Designer' },
    ] as Position[];

    expect(getAppliedPosition(positions, 'position-2')).toMatchObject({ title: 'Designer' });
    expect(getAppliedPosition(positions, 'missing')).toBeNull();
    expect(getAppliedPosition(positions, null)).toBeNull();
  });

  it('creates edit dialog state from the applicant', () => {
    expect(getInitialJobAppliedEditState({
      statusId: 'stage-1',
      recruiterId: 'recruiter-1',
      sourceId: 'source-1',
      expectedSalary: 75000,
    } as Applicant)).toEqual({
      status: 'stage-1',
      recruiterId: 'recruiter-1',
      sourceId: 'source-1',
      salary: '75000',
    });
  });

  it('derives current applicant assignment labels for display', () => {
    const assignments = getJobAppliedAssignments({
      applicant: {
        statusId: 'stage-1',
        recruiterId: 'recruiter-1',
        sourceId: 'source-1',
      } as Applicant,
      stages: [{ id: 'stage-1', name: 'Applied' }],
      recruiters: [{ id: 'recruiter-1', name: 'Ada' }],
      sources: [{ id: 'source-1', name: 'LinkedIn' }],
    });

    expect(assignments.currentStage).toEqual({ id: 'stage-1', name: 'Applied' });
    expect(assignments.currentRecruiter).toEqual({ id: 'recruiter-1', name: 'Ada' });
    expect(assignments.currentSource).toEqual({ id: 'source-1', name: 'LinkedIn' });
    expect(getJobAppliedAssignments({
      applicant: {} as Applicant,
      stages: [],
      recruiters: [],
      sources: [],
    })).toEqual({
      currentStage: null,
      currentRecruiter: null,
      currentSource: null,
    });
  });

  it('formats salary and trims justifications for presentation', () => {
    expect(formatJobAppliedExpectedSalary(75000)).toBe('THB 75,000');
    expect(formatJobAppliedExpectedSalary(null)).toBe('N/A');
    expect(formatJobAppliedExpectedSalary(Number.NaN)).toBe('N/A');
    expect(getNonEmptyJobAppliedJustifications([' Strong match ', ' ', 'Relevant skills'])).toEqual([
      'Strong match',
      'Relevant skills',
    ]);
  });

  it('classifies applicant justifications for positive and negative icons', () => {
    expect(getJobAppliedJustificationTone('Strong technical skills align with the role.')).toBe('positive');
    expect(getJobAppliedJustificationTone('Concern: limited leadership experience.')).toBe('negative');
    expect(getJobAppliedJustificationTone('Missing the required certification.')).toBe('negative');
    expect(getJobAppliedJustificationTone('ขาดประสบการณ์ด้านการบริหารทีม')).toBe('negative');
  });

  it('runs the job-applied dialog update success workflow', async () => {
    const calls: string[] = [];

    await runJobAppliedDialogUpdate({
      update: async () => calls.push('update'),
      setIsUpdating: (isUpdating) => calls.push(`updating:${isUpdating}`),
      updateFormValue: () => calls.push('form'),
      closeDialog: () => calls.push('close'),
      onRefresh: () => calls.push('refresh'),
      showSuccess: (message) => calls.push(`success:${message}`),
      showError: (message) => calls.push(`error:${message}`),
      successMessage: 'Saved',
      fallbackErrorMessage: 'Failed',
    });

    expect(calls).toEqual([
      'updating:true',
      'update',
      'form',
      'success:Saved',
      'close',
      'refresh',
      'updating:false',
    ]);
  });

  it('runs the job-applied dialog update error workflow with fallback messages', async () => {
    const calls: string[] = [];

    await runJobAppliedDialogUpdate({
      update: async () => {
        throw new Error('');
      },
      setIsUpdating: (isUpdating) => calls.push(`updating:${isUpdating}`),
      updateFormValue: () => calls.push('form'),
      closeDialog: () => calls.push('close'),
      onRefresh: () => calls.push('refresh'),
      showSuccess: (message) => calls.push(`success:${message}`),
      showError: (message) => calls.push(`error:${message}`),
      successMessage: 'Saved',
      fallbackErrorMessage: 'Failed',
    });

    expect(calls).toEqual([
      'updating:true',
      'error:Failed',
      'updating:false',
    ]);
  });
});
