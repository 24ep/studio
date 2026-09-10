import { describe, expect, it } from 'vitest';

import {
  APPLICANT_EVALUATION_TESTING_SKILLS,
  canSubmitApplicantEvaluationLinkCreate,
  clampEvaluationExpireDays,
  getApplicantEvaluationLinkActionState,
  getApplicantEvaluationPositionValidationIssues,
  hasApplicantEvaluationConfigIssue,
  shouldShowApplicantEvaluationPositionWarning,
} from './applicant-evaluation-modal-utils';

const validPosition = {
  hasInterviewers: true,
  hasSkills: true,
  isLoading: false,
  error: null,
};

describe('applicant-evaluation-modal-utils', () => {
  it('clamps evaluation link expiry days to the supported range', () => {
    expect(clampEvaluationExpireDays(0)).toBe(1);
    expect(clampEvaluationExpireDays(14)).toBe(14);
    expect(clampEvaluationExpireDays(900)).toBe(365);
    expect(clampEvaluationExpireDays('bad')).toBe(1);
  });

  it('defines the static expertise testing skill fixtures', () => {
    expect(APPLICANT_EVALUATION_TESTING_SKILLS).toHaveLength(6);
    expect(APPLICANT_EVALUATION_TESTING_SKILLS[0]).toEqual({
      name: 'English listening',
      score: 89,
      maxScore: 100,
    });
  });

  it('detects configuration issues and builds warning messages', () => {
    expect(hasApplicantEvaluationConfigIssue(validPosition)).toBe(false);

    const missingEverything = {
      hasInterviewers: false,
      hasSkills: false,
      isLoading: false,
      error: null,
    };

    expect(hasApplicantEvaluationConfigIssue(missingEverything)).toBe(true);
    expect(getApplicantEvaluationPositionValidationIssues(missingEverything)).toEqual([
      'No interviewers assigned to the position',
      'No evaluation skills assigned (requires at least 1 personality or expertise skill)',
    ]);

    expect(getApplicantEvaluationPositionValidationIssues({
      ...missingEverything,
      error: 'Position is archived',
    })).toEqual(['Position is archived']);
  });

  it('decides whether to show the position warning', () => {
    expect(shouldShowApplicantEvaluationPositionWarning({
      positionValidation: { ...validPosition, hasSkills: false },
      hasLink: false,
    })).toBe(true);

    expect(shouldShowApplicantEvaluationPositionWarning({
      positionValidation: { ...validPosition, hasSkills: false, isLoading: true },
      hasLink: false,
    })).toBe(false);

    expect(shouldShowApplicantEvaluationPositionWarning({
      positionValidation: { ...validPosition, hasSkills: false },
      hasLink: true,
    })).toBe(false);
  });

  it('derives evaluation link action state', () => {
    expect(getApplicantEvaluationLinkActionState({
      canViewLinks: false,
      positionValidation: validPosition,
      hasLink: false,
    })).toBe('no-permission');

    expect(getApplicantEvaluationLinkActionState({
      canViewLinks: true,
      positionValidation: { ...validPosition, isLoading: true },
      hasLink: false,
    })).toBe('loading');

    expect(getApplicantEvaluationLinkActionState({
      canViewLinks: true,
      positionValidation: { ...validPosition, hasSkills: false },
      hasLink: false,
    })).toBe('configuration-required');

    expect(getApplicantEvaluationLinkActionState({
      canViewLinks: true,
      positionValidation: validPosition,
      hasLink: false,
    })).toBe('create');

    expect(getApplicantEvaluationLinkActionState({
      canViewLinks: true,
      positionValidation: validPosition,
      hasLink: true,
    })).toBe('manage');
  });

  it('checks whether create-link submit can proceed', () => {
    expect(canSubmitApplicantEvaluationLinkCreate({
      linkLoading: false,
      canCreateLink: true,
      positionValidation: validPosition,
    })).toBe(true);

    expect(canSubmitApplicantEvaluationLinkCreate({
      linkLoading: true,
      canCreateLink: true,
      positionValidation: validPosition,
    })).toBe(false);

    expect(canSubmitApplicantEvaluationLinkCreate({
      linkLoading: false,
      canCreateLink: true,
      positionValidation: { ...validPosition, hasInterviewers: false },
    })).toBe(false);
  });
});
