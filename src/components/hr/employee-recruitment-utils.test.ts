import { describe, expect, it } from 'vitest';

import { getEmployeeRecruitmentData } from './employee-recruitment-utils';

describe('employee recruitment data', () => {
  it('prefers structured education and experience from the applicant record', () => {
    const result = getEmployeeRecruitmentData({
      educationData: [{ university: 'Structured University' }],
      experienceData: [{ company: 'Structured Company' }],
      parsedData: {
        education: [{ university: 'Parsed University' }],
        experience: [{ company: 'Parsed Company' }],
      },
    });

    expect(result.education).toEqual([{ university: 'Structured University' }]);
    expect(result.experience).toEqual([{ company: 'Structured Company' }]);
  });

  it('falls back to parsed resume data when structured arrays are empty', () => {
    const result = getEmployeeRecruitmentData({
      educationData: [],
      experienceData: null,
      parsedData: {
        education: [{ university: 'Parsed University' }],
        experience: [{ company: 'Parsed Company' }],
      },
    });

    expect(result.education).toEqual([{ university: 'Parsed University' }]);
    expect(result.experience).toEqual([{ company: 'Parsed Company' }]);
  });

  it('filters malformed list entries and safely handles an unlinked employee', () => {
    const result = getEmployeeRecruitmentData({
      attachments: [null, 'resume.pdf', { id: 'attachment-1', fileName: 'resume.pdf' }],
      transitionHistory: [false, { id: 'transition-1', stage: 'Interview' }],
    });

    expect(result.attachments).toEqual([{ id: 'attachment-1', fileName: 'resume.pdf' }]);
    expect(result.transitionHistory).toEqual([{ id: 'transition-1', stage: 'Interview' }]);
    expect(getEmployeeRecruitmentData(null).applicant).toBeNull();
  });

  it('preserves human-readable transition stage metadata', () => {
    const result = getEmployeeRecruitmentData({
      transitionHistory: [{
        id: 'transition-1',
        stage: '72c82c72-56cf-4d66-b866-16f208f12d48',
        stageName: 'Interview',
        stageColor: '#2563eb',
      }],
    });

    expect(result.transitionHistory[0]).toMatchObject({
      stageName: 'Interview',
      stageColor: '#2563eb',
    });
  });
});
