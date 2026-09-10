import { describe, expect, it } from 'vitest';
import {
  applicantSourceFormSchema,
  getApplicantSourceDialogCopy,
  getApplicantSourceFormDefaults,
  getApplicantSourceLogoPreview,
} from './ApplicantSourceModalTypes';

describe('ApplicantSourceModalTypes', () => {
  it('builds create and edit defaults', () => {
    expect(getApplicantSourceFormDefaults()).toEqual({
      name: '',
      description: '',
      email: '',
      allowSubSource: false,
      sortOrder: 0,
      isActive: true,
    });

    expect(getApplicantSourceFormDefaults({
      id: 'source-1',
      name: 'Referral',
      description: null,
      email: 'referral@example.com',
      allowSubSource: true,
      sortOrder: 5,
      isActive: false,
      logo: '/logo.png',
    })).toMatchObject({
      name: 'Referral',
      description: '',
      email: 'referral@example.com',
      allowSubSource: true,
      sortOrder: 5,
      isActive: false,
    });
  });

  it('derives modal copy and logo previews', () => {
    expect(getApplicantSourceDialogCopy(null).submitLabel).toBe('Create');
    expect(getApplicantSourceDialogCopy({ id: 'source-1', name: 'Referral' } as Parameters<typeof getApplicantSourceDialogCopy>[0]).title).toBe('Edit Applicant Source');
    expect(getApplicantSourceLogoPreview({ id: 'source-1', name: 'Referral', logo: '/logo.png' } as Parameters<typeof getApplicantSourceLogoPreview>[0])).toBe('/logo.png');
    expect(getApplicantSourceLogoPreview(null)).toBeNull();
  });

  it('validates required source names and coerces sort order', () => {
    expect(applicantSourceFormSchema.safeParse({ name: '' }).success).toBe(false);
    expect(applicantSourceFormSchema.parse({ name: 'Referral', sortOrder: '3' }).sortOrder).toBe(3);
  });
});
