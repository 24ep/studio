import { describe, expect, it } from 'vitest';

import {
  applyEvaluationExpertiseScoresToTestingResults,
  applyExpertiseScoresToTestingResults,
  applySelectedInterviewerEvaluationToFormData,
  buildSharedInterviewRemarkAttributes,
  buildEvaluationActiveQuestionViewState,
  buildEvaluationDataLoadState,
  buildEvaluationSavePayload,
  buildEvaluationsByInterviewer,
  buildDesktopEvaluateInterviewerStyle,
  buildEvaluateApplicantUrl,
  buildEvaluatePageCallbackUrl,
  buildEvaluatePositionCriteriaUrl,
  buildEvaluateSignInUrl,
  buildExistingEvaluationLoadState,
  buildExistingEvaluationRefreshState,
  buildExpertiseScoresForSave,
  buildExpertiseTestingResults,
  buildEvaluationTestResultRemovalAction,
  buildPersonalityEvaluationQuestions,
  buildPersonalityScoresForSave,
  calculateOverallEvaluationScore,
  canEditEvaluationAttachments,
  canEditEvaluationScores,
  canRemoveEvaluationInterviewer,
  canResetApplicantEvaluation,
  fetchEvaluatePageJobAppliedOptions,
  getDesktopEvaluateAiEvaluationItems,
  getDesktopEvaluateAttachmentFileName,
  getDesktopEvaluateAttachmentLabel,
  getDesktopEvaluateAttachmentName,
  getDesktopEvaluateInterviewerFallbackName,
  getDesktopEvaluateInterviewerPositionTitle,
  getDesktopEvaluateRemarkButtonClassName,
  getDesktopEvaluateRemarkDisplayText,
  getFirstEvaluationFromMap,
  getDefaultEvaluationInterviewerId,
  getEvaluateHeaderBackgroundColorForText,
  getEvaluateHeaderBackgroundStyle,
  getEvaluationTraitNavigationUpdate,
  getSharedInterviewRemarks,
  haveAllInterviewersCompleted,
  isEvaluationComplete,
  normalizeEvaluatePageSystemPreferences,
  normalizeEvaluatePageRecruiterOptions,
  mergeSavedEvaluationByEvaluator,
  moveEvaluationQuestion,
  selectEvaluationForInterviewer,
  shouldShowDesktopEvaluateInterviewerMenu,
  shouldShowDesktopEvaluateInterviewerMenuSeparator,
  sortPersonalityGroupsByDisplayOrder,
  updateEvaluationComments,
  updateEvaluationQuestionNotes,
  updateEvaluationQuestionScore,
} from './utils';
import type { EvaluationFormData, EvaluationQuestion, TestingResult } from './types';

const testApplicant = {
  id: 'applicant-1',
  name: 'Test Applicant',
} as EvaluationFormData['applicant'];

function makeEvaluationQuestion(overrides: Partial<EvaluationQuestion> = {}): EvaluationQuestion {
  return {
    id: overrides.id ?? overrides.traitId ?? 'question-1',
    traitId: overrides.traitId ?? 'trait-1',
    traitName: overrides.traitName ?? 'Trait',
    groupName: overrides.groupName ?? 'Group',
    description: overrides.description ?? '',
    shortDescription: overrides.shortDescription ?? '',
    score: overrides.score ?? 0,
    notes: overrides.notes ?? '',
  };
}

function makeEvaluationFormData(overrides: Partial<EvaluationFormData> = {}): EvaluationFormData {
  return {
    applicant: testApplicant,
    questions: [],
    currentQuestionIndex: 0,
    overallScore: 0,
    comments: '',
    ...overrides,
  };
}

function makeTestingResult(overrides: Partial<TestingResult> = {}): TestingResult {
  return {
    id: overrides.id ?? 'skill-1',
    label: overrides.label ?? 'Skill',
    score: overrides.score ?? 0,
    maxScore: overrides.maxScore ?? 100,
    ...overrides,
  };
}

describe('evaluate page utilities', () => {
  it('builds evaluate page URLs with encoded callback and token parameters', () => {
    expect(buildEvaluateSignInUrl('/applicants/applicant-1/evaluate?token=a b')).toBe(
      '/auth/signin?callbackUrl=%2Fapplicants%2Fapplicant-1%2Fevaluate%3Ftoken%3Da%20b'
    );
    expect(buildEvaluatePageCallbackUrl('applicant-1', 'share token')).toBe(
      '/applicants/applicant-1/evaluate?token=share%20token'
    );
    expect(buildEvaluatePageCallbackUrl('applicant-1', null)).toBe('/applicants/applicant-1/evaluate');
    expect(buildEvaluateApplicantUrl('applicant-1', 'share/token')).toBe(
      '/api/applicants/applicant-1?token=share%2Ftoken'
    );
    expect(buildEvaluateApplicantUrl('applicant-1')).toBe('/api/applicants/applicant-1');
    expect(buildEvaluatePositionCriteriaUrl('position-1', 'share/token')).toBe(
      '/api/v1/positions/position-1/evaluation?token=share%2Ftoken'
    );
    expect(buildEvaluatePositionCriteriaUrl('position-1')).toBe('/api/v1/positions/position-1/evaluation');
  });

  it('derives desktop evaluate attachment and AI summary display helpers', () => {
    expect(getDesktopEvaluateAttachmentName({ filename: 'cv-old.pdf' })).toBe('cv-old.pdf');
    expect(getDesktopEvaluateAttachmentName({ fileName: 'cv.pdf' })).toBe('cv.pdf');
    expect(getDesktopEvaluateAttachmentName({ name: 'named.pdf' })).toBe('named.pdf');
    expect(getDesktopEvaluateAttachmentName({ originalName: 'original.pdf' })).toBe('original.pdf');
    expect(getDesktopEvaluateAttachmentName(null)).toBe('Attachment');
    expect(getDesktopEvaluateAttachmentFileName({ fileName: 'cv.pdf' })).toBe('cv.pdf');
    expect(getDesktopEvaluateAttachmentFileName({})).toBe('Attachment');
    expect(getDesktopEvaluateAttachmentLabel({ label: 'DOCX' })).toBe('DOCX');
    expect(getDesktopEvaluateAttachmentLabel({})).toBe('PDF');

    expect(getDesktopEvaluateAiEvaluationItems({
      assignmentJustification: ['Strong React', '', null, 'Good culture fit'],
    })).toEqual(['Strong React', 'Good culture fit']);
    expect(getDesktopEvaluateAiEvaluationItems({
      aiEvaluation: 'First point\n\n Second point ',
    })).toEqual(['First point', 'Second point']);
    expect(getDesktopEvaluateAiEvaluationItems({})).toEqual([]);
  });

  it('derives desktop evaluate interviewer styles and menu state', () => {
    const styleInput = {
      interviewerSelectedBgColor: 'linear-gradient(red, blue)',
      interviewerSelectedTextColor: '0 0% 100%',
      interviewerSelectedBorderColor: '220 15% 50%',
      interviewerSelectedBorderWidth: '2px',
      interviewerNonSelectedBgColor: '220 25% 97%',
      interviewerNonSelectedTextColor: '220 25% 50%',
      interviewerNonSelectedBorderColor: '220 15% 85%',
      interviewerNonSelectedBorderWidth: '1px',
    };

    expect(buildDesktopEvaluateInterviewerStyle(styleInput, true)).toMatchObject({
      background: 'linear-gradient(red, blue)',
      color: 'hsl(0 0% 100%)',
      borderColor: 'hsl(220 15% 50%)',
      borderWidth: '2px',
      borderStyle: 'solid',
    });
    expect(buildDesktopEvaluateInterviewerStyle({
      ...styleInput,
      interviewerSelectedBgColor: '220 25% 97%',
    }, true)).toMatchObject({
      backgroundColor: 'hsl(220 25% 97%)',
    });
    expect(buildDesktopEvaluateInterviewerStyle(styleInput, false)).toMatchObject({
      backgroundColor: 'hsl(220 25% 97%)',
      color: 'hsl(220 25% 50%)',
      borderColor: 'hsl(220 15% 85%)',
      borderWidth: '1px',
    });

    expect(shouldShowDesktopEvaluateInterviewerMenu({
      canResetEvaluation: true,
      canRemoveInterviewer: false,
      hasEvaluation: true,
    })).toBe(true);
    expect(shouldShowDesktopEvaluateInterviewerMenu({
      canResetEvaluation: false,
      canRemoveInterviewer: false,
      hasEvaluation: true,
    })).toBe(false);
    expect(shouldShowDesktopEvaluateInterviewerMenuSeparator({
      canResetEvaluation: true,
      canRemoveInterviewer: true,
      hasEvaluation: true,
    })).toBe(true);
    expect(shouldShowDesktopEvaluateInterviewerMenuSeparator({
      canResetEvaluation: true,
      canRemoveInterviewer: true,
      hasEvaluation: false,
    })).toBe(false);
  });

  it('derives desktop evaluate interviewer labels and remark presentation', () => {
    expect(getDesktopEvaluateInterviewerPositionTitle({ positionTitle: 'Panel Lead' }, 'Fallback')).toBe('Panel Lead');
    expect(getDesktopEvaluateInterviewerPositionTitle({}, 'Fallback')).toBe('Fallback');
    expect(getDesktopEvaluateInterviewerPositionTitle({}, null)).toBe('');
    expect(getDesktopEvaluateInterviewerFallbackName({ userName: 'Ada' })).toBe('A');
    expect(getDesktopEvaluateInterviewerFallbackName({})).toBe('');
    expect(getDesktopEvaluateRemarkDisplayText('  Strong candidate  ')).toBe('  Strong candidate  ');
    expect(getDesktopEvaluateRemarkDisplayText('   ')).toBe('Remark to interviewer');
    expect(getDesktopEvaluateRemarkButtonClassName(true)).toContain('rounded-full shadow-lg');
    expect(getDesktopEvaluateRemarkButtonClassName(true)).not.toContain('cursor-not-allowed');
    expect(getDesktopEvaluateRemarkButtonClassName(false)).toContain('opacity-80 cursor-not-allowed');
  });

  it('builds active expertise testing results without duplicate group skills', () => {
    const results = buildExpertiseTestingResults({
      expertiseSkills: [
        { id: 'assignment-1', skill: { id: 'skill-1', name: 'React', maxScore: 80 } },
        { id: 'assignment-2', skill: { id: 'inactive', name: 'Inactive', isActive: false } },
      ],
      expertiseGroups: [
        {
          id: 'group-assignment-1',
          group: {
            name: 'Frontend',
            skills: [
              { id: 'skill-1', name: 'React' },
              { id: 'skill-2', name: 'CSS' },
            ],
          },
        },
      ],
    });

    expect(results).toEqual([
      { id: 'skill-1', assignmentId: 'assignment-1', label: 'React', score: 0, maxScore: 80 },
      { id: 'skill-2', groupAssignmentId: 'group-assignment-1', groupName: 'Frontend', label: 'CSS', score: 0, maxScore: 100 },
    ]);
  });

  it('builds expertise test result removal actions', () => {
    expect(buildEvaluationTestResultRemovalAction({
      positionId: null,
      testResult: { assignmentId: 'assignment-1' },
    })).toEqual({
      type: 'invalid',
      message: 'Position not found',
    });

    expect(buildEvaluationTestResultRemovalAction({
      positionId: 'position-1',
      testResult: null,
    })).toEqual({
      type: 'invalid',
      message: 'Test result not found',
    });

    expect(buildEvaluationTestResultRemovalAction({
      positionId: 'position-1',
      testResult: { assignmentId: 'assignment-1' },
    })).toEqual({
      type: 'direct-skill',
      url: '/api/positions/position-1/expertise-skills/assignment-1',
      successMessage: 'Skill removed successfully',
      failureMessage: 'Failed to remove skill',
      removeLocalResult: true,
    });

    expect(buildEvaluationTestResultRemovalAction({
      positionId: 'position-1',
      testResult: { groupAssignmentId: 'group-assignment-1', groupName: 'Frontend' },
    })).toEqual({
      type: 'group',
      url: '/api/positions/position-1/expertise-groups/group-assignment-1',
      confirmationMessage: "This skill is part of the 'Frontend' expertise group. To remove it, you must remove the entire group from the position. Do you want to continue?",
      successMessage: 'Expertise group removed successfully',
      failureMessage: 'Failed to remove expertise group',
      removeLocalResult: false,
    });

    expect(buildEvaluationTestResultRemovalAction({
      positionId: 'position-1',
      testResult: {},
    })).toEqual({
      type: 'invalid',
      message: 'Cannot remove skill - unknown assignment type',
    });
  });

  it('applies latest expertise scores to testing results', () => {
    const testingResults = [
      { id: 'skill-1', label: 'React', score: 0, maxScore: 100 },
      { id: 'skill-2', label: 'CSS', score: 0, maxScore: 100 },
    ];

    expect(applyExpertiseScoresToTestingResults(testingResults, [
      { createdAt: '2024-01-01', expertiseScores: [{ skillId: 'skill-1', score: 50 }] },
      { createdAt: '2024-02-01', expertiseScores: [{ skillId: 'skill-1', score: 75 }] },
      { createdAt: '2024-03-01', expertiseScores: [{ skillId: 'skill-2', score: 'bad score' }] },
    ])).toEqual([
      { id: 'skill-1', label: 'React', score: 75, maxScore: 100 },
      { id: 'skill-2', label: 'CSS', score: 0, maxScore: 100 },
    ]);
  });

  it('applies expertise scores from a single selected evaluation', () => {
    const testingResults = [
      { id: 'skill-1', label: 'React', score: 10, maxScore: 100 },
      { id: 'skill-2', label: 'CSS', score: 20, maxScore: 100 },
    ];

    expect(applyEvaluationExpertiseScoresToTestingResults(testingResults, {
      expertiseScores: [{ skillId: 'skill-2', score: 88 }],
    })).toEqual([
      { id: 'skill-1', label: 'React', score: 10, maxScore: 100 },
      { id: 'skill-2', label: 'CSS', score: 88, maxScore: 100 },
    ]);

    expect(applyEvaluationExpertiseScoresToTestingResults(testingResults, null)).toBe(testingResults);
    expect(applyEvaluationExpertiseScoresToTestingResults(testingResults, { expertiseScores: null })).toBe(testingResults);
  });

  it('reads shared interview remarks from current or legacy applicant attributes', () => {
    expect(getSharedInterviewRemarks({
      customAttributes: { interviewRemarks: 'current remarks' },
      custom_attributes: { interviewRemarks: 'legacy remarks' },
    })).toBe('current remarks');
    expect(getSharedInterviewRemarks({
      custom_attributes: { interviewRemarks: 'legacy remarks' },
    })).toBe('legacy remarks');
    expect(getSharedInterviewRemarks(null)).toBe('');
  });

  it('builds shared interview remark attributes without dropping existing fields', () => {
    const currentAttributes = { interviewRemarks: 'old remarks', level: 'senior' };
    const legacyAttributes: { interviewRemarks?: string | null; source: string } = { source: 'legacy' };

    expect(buildSharedInterviewRemarkAttributes({
      customAttributes: currentAttributes,
    }, 'new remarks')).toEqual({
      interviewRemarks: 'new remarks',
      level: 'senior',
    });

    expect(buildSharedInterviewRemarkAttributes({
      custom_attributes: legacyAttributes,
    }, 'legacy remarks')).toEqual({
      source: 'legacy',
      interviewRemarks: 'legacy remarks',
    });
  });

  it('maps evaluations by interviewer and returns the first mapped evaluation', () => {
    const firstEvaluation = { evaluator: { id: 'interviewer-1' }, status: 'completed' };
    const secondEvaluation = { evaluator: { id: 'interviewer-2' }, status: 'in_progress' };
    const evaluationsMap = buildEvaluationsByInterviewer([
      firstEvaluation,
      { status: 'ignored-without-evaluator' },
      secondEvaluation,
    ]);

    expect(evaluationsMap.get('interviewer-1')).toBe(firstEvaluation);
    expect(evaluationsMap.get('interviewer-2')).toBe(secondEvaluation);
    expect(evaluationsMap.size).toBe(2);
    expect(getFirstEvaluationFromMap(evaluationsMap)).toBe(firstEvaluation);

    expect(buildEvaluationsByInterviewer({
      evaluator: { id: 'single-interviewer' },
      overallScore: 4,
    }).get('single-interviewer')).toEqual({
      evaluator: { id: 'single-interviewer' },
      overallScore: 4,
    });
  });

  it('merges saved evaluations by evaluator id', () => {
    const existing = { evaluator: { id: 'interviewer-1' }, overallScore: 3 };
    const saved = { evaluator: { id: 'interviewer-2' }, overallScore: 5 };
    const initialMap = buildEvaluationsByInterviewer([existing]);
    const result = mergeSavedEvaluationByEvaluator(initialMap, saved);

    expect(result.evaluatorId).toBe('interviewer-2');
    expect(result.evaluationsMap.get('interviewer-1')).toBe(existing);
    expect(result.evaluationsMap.get('interviewer-2')).toBe(saved);
    expect(initialMap.has('interviewer-2')).toBe(false);

    const unchanged = mergeSavedEvaluationByEvaluator(initialMap, { overallScore: 4 });
    expect(unchanged.evaluatorId).toBeNull();
    expect(unchanged.evaluationsMap).not.toBe(initialMap);
    expect(unchanged.evaluationsMap.size).toBe(1);
  });

  it('selects an existing evaluation for the active interviewer', () => {
    const firstEvaluation = { evaluator: { id: 'interviewer-1' }, overallScore: 3 };
    const secondEvaluation = { evaluator: { id: 'interviewer-2' }, overallScore: 5 };
    const evaluations = [firstEvaluation, secondEvaluation];

    expect(selectEvaluationForInterviewer(evaluations, 'interviewer-2')).toBe(secondEvaluation);
    expect(selectEvaluationForInterviewer(evaluations, 'missing')).toBeNull();
    expect(selectEvaluationForInterviewer(evaluations, null)).toBe(firstEvaluation);
    expect(selectEvaluationForInterviewer([], null)).toBeNull();
    expect(selectEvaluationForInterviewer(null, 'interviewer-1')).toBeNull();
  });

  it('builds existing evaluation load state from all or selected evaluation scores', () => {
    const testingResults = [
      { id: 'skill-1', label: 'React', score: 0, maxScore: 100 },
      { id: 'skill-2', label: 'CSS', score: 0, maxScore: 100 },
    ];
    const firstEvaluation = {
      evaluator: { id: 'interviewer-1' },
      createdAt: '2024-01-01',
      expertiseScores: [{ skillId: 'skill-1', score: 40 }],
    };
    const selectedEvaluation = {
      evaluator: { id: 'interviewer-2' },
      createdAt: '2024-02-01',
      expertiseScores: [{ skillId: 'skill-2', score: 85 }],
    };

    const allEvaluationState = buildExistingEvaluationLoadState({
      testingResults,
      evaluations: [firstEvaluation, selectedEvaluation],
      selectedInterviewerId: 'interviewer-2',
      scoreSource: 'all-evaluations',
    });

    expect(allEvaluationState.existingEvaluation).toBe(selectedEvaluation);
    expect(allEvaluationState.evaluationsMap.get('interviewer-1')).toBe(firstEvaluation);
    expect(allEvaluationState.testingResults).toEqual([
      { id: 'skill-1', label: 'React', score: 40, maxScore: 100 },
      { id: 'skill-2', label: 'CSS', score: 85, maxScore: 100 },
    ]);

    const selectedEvaluationState = buildExistingEvaluationLoadState({
      testingResults,
      evaluations: [firstEvaluation],
      selectedInterviewerId: 'interviewer-2',
      scoreSource: 'selected-evaluation',
    });

    expect(selectedEvaluationState.existingEvaluation).toBeNull();
    expect(selectedEvaluationState.testingResults).toBe(testingResults);
  });

  it('builds evaluation data load state from applicant criteria and existing evaluations', () => {
    const applicant = {
      id: 'applicant-1',
      name: 'Mira Candidate',
      recruiterId: 'recruiter-1',
      position: { id: 'position-1', title: 'Frontend Engineer' },
    };
    const evaluationCriteria = {
      expertiseSkills: [
        { id: 'assignment-1', skill: { id: 'skill-1', name: 'React' } },
      ],
      personalityTraits: [
        { trait: { id: 'trait-1', name: 'Ownership' } },
      ],
    };
    const selectedEvaluation = {
      evaluator: { id: 'interviewer-2' },
      comments: 'Strong hire signal',
      overallScore: 4,
      expertiseScores: [{ skillId: 'skill-1', score: 90 }],
      personalityScores: [{ traitId: 'trait-1', score: 5, notes: 'Great examples' }],
    };

    const loadState = buildEvaluationDataLoadState({
      applicant,
      applicantPositionId: 'position-1',
      positionTitle: 'Frontend Engineer',
      evaluationCriteria,
      existingEvaluationData: [
        { evaluator: { id: 'interviewer-1' }, expertiseScores: [] },
        selectedEvaluation,
      ],
      selectedInterviewerId: 'interviewer-2',
      idSuffix: 'stable',
    });

    expect(loadState.applicantRecruiterId).toBe('recruiter-1');
    expect(loadState.positionId).toBe('position-1');
    expect(loadState.positionTitle).toBe('Frontend Engineer');
    expect(loadState.existingEvaluation).toBe(selectedEvaluation);
    expect(loadState.evaluationsMap?.get('interviewer-2')).toBe(selectedEvaluation);
    expect(loadState.testingResults).toEqual([
      { id: 'skill-1', assignmentId: 'assignment-1', label: 'React', score: 90, maxScore: 100 },
    ]);
    expect(loadState.formData).toMatchObject({
      applicant,
      position: applicant.position,
      currentQuestionIndex: 0,
      overallScore: 4,
      comments: 'Strong hire signal',
      questions: [
        {
          id: 'trait-1-stable',
          traitId: 'trait-1',
          traitName: 'Ownership',
          score: 5,
          notes: 'Great examples',
        },
      ],
    });
  });

  it('throws a helpful evaluation load error when no personality traits are configured', () => {
    expect(() => buildEvaluationDataLoadState({
      applicant: { position: { title: 'Designer' } },
      applicantPositionId: 'position-1',
      evaluationCriteria: {},
      idSuffix: 'stable',
    })).toThrow(
      'No evaluation traits configured for Designer. Please configure personality traits in the position settings before evaluating applicants.'
    );
  });

  it('builds existing evaluation refresh state from list, single, or empty payloads', () => {
    const firstEvaluation = { evaluator: { id: 'interviewer-1' }, overallScore: 3 };
    const secondEvaluation = { evaluator: { id: 'interviewer-2' }, overallScore: 5 };

    const listState = buildExistingEvaluationRefreshState([firstEvaluation, secondEvaluation]);
    expect(listState.existingEvaluation).toBe(firstEvaluation);
    expect(listState.selectedInterviewerId).toBe('interviewer-1');
    expect(listState.evaluationsMap.get('interviewer-2')).toBe(secondEvaluation);

    const singleState = buildExistingEvaluationRefreshState(secondEvaluation);
    expect(singleState.existingEvaluation).toBe(secondEvaluation);
    expect(singleState.selectedInterviewerId).toBe('interviewer-2');
    expect(singleState.evaluationsMap.size).toBe(1);

    const emptyState = buildExistingEvaluationRefreshState(null);
    expect(emptyState.existingEvaluation).toBeNull();
    expect(emptyState.selectedInterviewerId).toBeNull();
    expect(emptyState.evaluationsMap.size).toBe(0);
  });

  it('checks evaluation completion across interviewers', () => {
    expect(isEvaluationComplete(null)).toBe(false);
    expect(isEvaluationComplete({ status: ' completed ' })).toBe(true);
    expect(isEvaluationComplete({ personalityScores: [{ traitId: 'trait-1' }] })).toBe(true);
    expect(isEvaluationComplete({ overallScore: 0 })).toBe(true);
    expect(isEvaluationComplete({ status: 'in_progress', personalityScores: [] })).toBe(false);

    const evaluationsMap = buildEvaluationsByInterviewer([
      { evaluator: { id: 'interviewer-1' }, status: 'completed' },
      { evaluator: { id: 'interviewer-2' }, personalityScores: [{ traitId: 'trait-1' }] },
    ]);

    expect(haveAllInterviewersCompleted([
      { userId: 'interviewer-1' },
      { userId: 'interviewer-2' },
    ], evaluationsMap)).toBe(true);
    expect(haveAllInterviewersCompleted([
      { userId: 'interviewer-1' },
      { userId: 'missing' },
    ], evaluationsMap)).toBe(false);
    expect(haveAllInterviewersCompleted([], evaluationsMap)).toBe(false);
  });

  it('selects the default interviewer only when evaluation data is ready', () => {
    expect(getDefaultEvaluationInterviewerId({
      loading: false,
      loadingEvaluation: false,
      selectedInterviewerId: null,
      interviewers: [{ userId: 'interviewer-1' }],
    })).toBe('interviewer-1');

    expect(getDefaultEvaluationInterviewerId({
      loading: true,
      loadingEvaluation: false,
      selectedInterviewerId: null,
      interviewers: [{ userId: 'interviewer-1' }],
    })).toBeNull();

    expect(getDefaultEvaluationInterviewerId({
      loading: false,
      loadingEvaluation: true,
      selectedInterviewerId: null,
      interviewers: [{ userId: 'interviewer-1' }],
    })).toBeNull();

    expect(getDefaultEvaluationInterviewerId({
      loading: false,
      loadingEvaluation: false,
      selectedInterviewerId: 'interviewer-2',
      interviewers: [{ userId: 'interviewer-1' }],
    })).toBeNull();

    expect(getDefaultEvaluationInterviewerId({
      loading: false,
      loadingEvaluation: false,
      selectedInterviewerId: null,
      interviewers: [],
    })).toBeNull();
  });

  it('applies selected interviewer personality scores to form data', () => {
    const formData = makeEvaluationFormData({
      questions: [
        makeEvaluationQuestion({ id: 'question-1', traitId: 'trait-1', score: 1, notes: 'old' }),
        makeEvaluationQuestion({ id: 'question-2', traitId: 'trait-2', score: 2, notes: 'old' }),
      ],
      overallScore: 1,
      comments: 'old comments',
    });

    expect(applySelectedInterviewerEvaluationToFormData(formData, {
      personalityScores: [{ traitId: 'trait-1', score: 5, notes: 'great' }],
      overallScore: 4.5,
      comments: 'new comments',
    })).toMatchObject({
      questions: [
        { traitId: 'trait-1', score: 5, notes: 'great' },
        { traitId: 'trait-2', score: 0, notes: '' },
      ],
      overallScore: 4.5,
      comments: 'new comments',
    });
  });

  it('resets form data when selecting an interviewer without an evaluation', () => {
    expect(applySelectedInterviewerEvaluationToFormData(makeEvaluationFormData({
      questions: [
        makeEvaluationQuestion({ traitId: 'trait-1', score: 4, notes: 'note' }),
      ],
      overallScore: 4,
      comments: 'comment',
    }), null)).toMatchObject({
      questions: [
        { traitId: 'trait-1', score: 0, notes: '' },
      ],
      overallScore: 0,
      comments: '',
    });
  });

  it('updates question scores and recalculates the overall score', () => {
    const formData = makeEvaluationFormData({
      currentQuestionIndex: 0,
      overallScore: 0,
      questions: [
        makeEvaluationQuestion({ id: 'question-1', score: 1 }),
        makeEvaluationQuestion({ id: 'question-2', score: 3 }),
      ],
    });

    expect(updateEvaluationQuestionScore(formData, 'question-1', 5)).toMatchObject({
      questions: [
        { id: 'question-1', score: 5 },
        { id: 'question-2', score: 3 },
      ],
      overallScore: 4,
      currentQuestionIndex: 0,
      shouldAutoAdvance: true,
      formData: {
        overallScore: 4,
        questions: [
          { id: 'question-1', score: 5 },
          { id: 'question-2', score: 3 },
        ],
      },
    });

    expect(updateEvaluationQuestionScore({
      ...formData,
      currentQuestionIndex: 2,
    }, 'question-1', 5)).toMatchObject({
      shouldAutoAdvance: false,
    });
  });

  it('updates notes, comments, and bounded question navigation', () => {
    const formData = makeEvaluationFormData({
      currentQuestionIndex: 1,
      comments: 'old',
      overallScore: 3,
      questions: [
        makeEvaluationQuestion({ id: 'question-1', notes: '' }),
        makeEvaluationQuestion({ id: 'question-2', notes: 'old note' }),
      ],
    });

    expect(updateEvaluationQuestionNotes(formData, 'question-2', 'new note')).toMatchObject({
      questions: [
        { id: 'question-1', notes: '' },
        { id: 'question-2', notes: 'new note' },
      ],
      overallScore: 3,
    });
    expect(updateEvaluationComments(formData, 'new comments')).toMatchObject({
      comments: 'new comments',
    });
    expect(moveEvaluationQuestion(formData, 'previous')).toMatchObject({ currentQuestionIndex: 0 });
    expect(moveEvaluationQuestion(formData, 'next')).toMatchObject({ currentQuestionIndex: 2 });
    expect(moveEvaluationQuestion({ ...formData, currentQuestionIndex: 0 }, 'previous')).toMatchObject({ currentQuestionIndex: 0 });
    expect(moveEvaluationQuestion({ ...formData, currentQuestionIndex: 2 }, 'next')).toMatchObject({ currentQuestionIndex: 2 });
  });

  it('builds trait navigation updates for evaluation forms', () => {
    const formData = makeEvaluationFormData({
      currentQuestionIndex: 0,
      questions: [
        makeEvaluationQuestion({ id: 'question-1', traitId: 'trait-1' }),
        makeEvaluationQuestion({ id: 'question-2', traitId: 'trait-2' }),
      ],
    });

    expect(getEvaluationTraitNavigationUpdate(formData, 'trait-2')).toMatchObject({
      questionIndex: 1,
      formData: {
        currentQuestionIndex: 1,
      },
    });

    expect(getEvaluationTraitNavigationUpdate(formData, 'missing-trait')).toBeNull();
    expect(getEvaluationTraitNavigationUpdate(null, 'trait-1')).toBeNull();
    expect(getEvaluationTraitNavigationUpdate(formData, null)).toBeNull();
  });

  it('builds active question view state for question and comments pages', () => {
    const questions = [
      makeEvaluationQuestion({ id: 'question-1', traitId: 'trait-1' }),
      makeEvaluationQuestion({ id: 'question-2', traitId: 'trait-2' }),
    ];

    expect(buildEvaluationActiveQuestionViewState({
      currentQuestionIndex: 1,
      questions,
    })).toEqual({
      isCommentsView: false,
      currentQuestion: questions[1],
      progressLabel: 'Question 2/2',
      totalCount: 2,
    });

    expect(buildEvaluationActiveQuestionViewState({
      currentQuestionIndex: 2,
      questions,
    })).toEqual({
      isCommentsView: true,
      currentQuestion: questions[0],
      progressLabel: 'Comments',
      totalCount: 2,
    });

    expect(buildEvaluationActiveQuestionViewState({
      currentQuestionIndex: 99,
      questions,
    }).currentQuestion).toBe(questions[0]);
  });

  it('builds personality questions from groups and individual traits', () => {
    const questions = buildPersonalityEvaluationQuestions({
      personalityGroups: [
        {
          group: {
            name: 'Core',
            traits: [
              { id: 'trait-2', name: 'Ownership', sortOrder: 2 },
              { id: 'trait-1', name: 'Communication', sortOrder: 1, short_description: 'Clear' },
              { id: 'inactive', name: 'Inactive', isActive: false },
              { id: null, name: 'Missing id' },
            ],
          },
        },
      ],
      personalityTraits: [
        { trait: { id: 'trait-2', name: 'Ownership' } },
        { trait: { id: 'trait-3', name: 'Curiosity', group: { name: 'Extra' } } },
        { trait: { id: 'trait-4', name: null } },
      ],
    }, {
      personalityScores: [
        { traitId: 'trait-1', score: 4, notes: 'Strong signal' },
        { traitId: 'trait-2', score: 'bad score', notes: null },
      ],
    }, 'test');

    expect(questions.map(question => ({
      id: question.id,
      traitId: question.traitId,
      traitName: question.traitName,
      groupName: question.groupName,
      score: question.score,
      notes: question.notes,
      shortDescription: question.shortDescription,
    }))).toEqual([
      {
        id: 'trait-1-test',
        traitId: 'trait-1',
        traitName: 'Communication',
        groupName: 'Core',
        score: 4,
        notes: 'Strong signal',
        shortDescription: 'Clear',
      },
      {
        id: 'trait-2-test',
        traitId: 'trait-2',
        traitName: 'Ownership',
        groupName: 'Core',
        score: 0,
        notes: '',
        shortDescription: '',
      },
      {
        id: 'trait-3-test',
        traitId: 'trait-3',
        traitName: 'Curiosity',
        groupName: 'Extra',
        score: 0,
        notes: '',
        shortDescription: '',
      },
    ]);
  });

  it('calculates overall score from existing override or question average', () => {
    expect(calculateOverallEvaluationScore([], { overallScore: 4.5 })).toBe(4.5);
    expect(calculateOverallEvaluationScore([
      makeEvaluationQuestion({ score: 2 }),
      makeEvaluationQuestion({ score: 4 }),
    ])).toBe(3);
  });

  it('normalizes evaluate page system preferences from settings arrays', () => {
    expect(normalizeEvaluatePageSystemPreferences({
      settings: [
        { key: 'evaluateReportLogoDataUrl', value: 'report-logo' },
        { key: 'evaluatePlatformLogoDataUrl', value: 'platform-logo' },
        { key: 'appLogoDataUrl', value: 'app-logo' },
        { key: 'evaluateHeaderBackgroundType', value: 'solid' },
        { key: 'evaluateHeaderBackgroundColor', value: '10 20% 30%' },
        { key: 'interviewerSelectedBorderWidth', value: '4px' },
      ],
    })).toMatchObject({
      appLogoUrl: 'report-logo',
      evaluateHeaderBackgroundType: 'solid',
      evaluateHeaderBackgroundColor: '10 20% 30%',
      interviewerSelectedBorderWidth: '4px',
    });
  });

  it('normalizes evaluate header gradient preferences with legacy fallback', () => {
    expect(normalizeEvaluatePageSystemPreferences({
      evaluateHeaderBackgroundGradientStart: '1 2% 3%',
      evaluateHeaderBackgroundGradientEnd: '4 5% 6%',
    }).evaluateHeaderBackgroundGradient).toBe('linear-gradient(135deg, hsl(1 2% 3%), hsl(4 5% 6%))');

    expect(normalizeEvaluatePageSystemPreferences({})).toMatchObject({
      appLogoUrl: null,
      evaluateHeaderBackgroundType: 'gradient',
      evaluateHeaderBackgroundGradient: 'linear-gradient(135deg, hsl(179 67% 66%), hsl(238 74% 61%))',
      interviewerNonSelectedBorderWidth: '1px',
      interviewerNameColor: '220 25% 30%',
    });
  });

  it('normalizes evaluate page recruiter options from array or wrapped data responses', () => {
    expect(normalizeEvaluatePageRecruiterOptions([
      { id: 'user-1', name: 'Ari Recruiter', email: 'ari@example.com' },
      { id: 'user-2', email: 'backup@example.com' },
      { name: 'missing id' },
    ])).toEqual([
      { id: 'user-1', name: 'Ari Recruiter' },
      { id: 'user-2', name: 'backup@example.com' },
    ]);

    expect(normalizeEvaluatePageRecruiterOptions({
      data: [{ id: 'user-3', name: '', email: '' }],
    })).toEqual([
      { id: 'user-3', name: 'user-3' },
    ]);
  });

  it('fetches evaluate page job applied options with endpoint-specific fallbacks', async () => {
    const responses = new Map<string, unknown>([
      ['/api/positions', { data: [{ id: 'position-1', title: 'Engineer' }] }],
      ['/api/settings/recruitment-stages', [{ id: 'stage-1', name: 'Applied' }]],
      ['/api/users', { data: [{ id: 'recruiter-1', email: 'recruiter@example.com' }] }],
      ['/api/settings/applicant-sources', [{ id: 'source-1', name: 'LinkedIn' }]],
    ]);

    const fetcher = async (url: string) => ({
      ok: true,
      json: async () => responses.get(url),
    });

    await expect(fetchEvaluatePageJobAppliedOptions(fetcher)).resolves.toEqual({
      positions: [{ id: 'position-1', title: 'Engineer' }],
      stages: [{ id: 'stage-1', name: 'Applied' }],
      recruiters: [{ id: 'recruiter-1', name: 'recruiter@example.com' }],
      sources: [{ id: 'source-1', name: 'LinkedIn' }],
    });

    await expect(fetchEvaluatePageJobAppliedOptions(async (url: string) => ({
      ok: url !== '/api/users',
      json: async () => [{ id: 'item-1', name: 'Item' }],
    }))).resolves.toMatchObject({
      recruiters: [],
    });
  });

  it('sorts personality groups by display order and name', () => {
    expect(sortPersonalityGroupsByDisplayOrder([
      { name: 'Zeta', sortOrder: 2 },
      { name: 'Beta', sortOrder: 1 },
      { name: 'Alpha', sortOrder: 1 },
      { name: 'No order' },
    ])).toEqual([
      { name: 'No order' },
      { name: 'Alpha', sortOrder: 1 },
      { name: 'Beta', sortOrder: 1 },
      { name: 'Zeta', sortOrder: 2 },
    ]);
  });

  it('builds saveable personality and expertise score arrays', () => {
    expect(buildPersonalityScoresForSave([
      makeEvaluationQuestion({ traitId: 'trait-1', score: 1 }),
      makeEvaluationQuestion({ traitId: 'trait-2', score: 5 }),
      makeEvaluationQuestion({ traitId: 'trait-3', score: 0 }),
      makeEvaluationQuestion({ traitId: '', score: 3 }),
      makeEvaluationQuestion({ traitId: 'trait-4', score: 6 }),
    ])).toEqual([
      { traitId: 'trait-1', score: 1, notes: '' },
      { traitId: 'trait-2', score: 5, notes: '' },
    ]);

    expect(buildExpertiseScoresForSave([
      makeTestingResult({ id: 'skill-1', score: 0 }),
      makeTestingResult({ id: 'skill-2', score: 80 }),
      makeTestingResult({ id: 'skill-3', score: -1 }),
    ])).toEqual([
      { skillId: 'skill-1', score: 0, notes: '' },
      { skillId: 'skill-2', score: 80, notes: '' },
    ]);
  });

  it('builds the evaluation save payload consistently', () => {
    expect(buildEvaluationSavePayload({
      applicantPositionId: 'position-1',
      evaluatorId: 'interviewer-1',
      questions: [makeEvaluationQuestion({ traitId: 'trait-1', score: 4 })],
      testingResults: [makeTestingResult({ id: 'skill-1', score: 70 })],
      overallScore: 4,
      comments: 'Looks good',
      status: 'completed',
    })).toEqual({
      positionId: 'position-1',
      evaluatorId: 'interviewer-1',
      personalityScores: [{ traitId: 'trait-1', score: 4, notes: '' }],
      expertiseScores: [{ skillId: 'skill-1', score: 70, notes: '' }],
      overallScore: 4,
      comments: 'Looks good',
      status: 'completed',
    });
  });

  it('evaluates edit permissions for evaluation workflows', () => {
    expect(canEditEvaluationScores(null, 'recruiter-1')).toBe(false);
    expect(canEditEvaluationScores({ id: 'user-1', role: 'Admin', modulePermissions: [] }, null)).toBe(true);
    expect(canEditEvaluationScores({
      id: 'user-1',
      role: 'Recruiter',
      modulePermissions: ['APPLICANTS_EDIT_SENSITIVE'],
    }, null)).toBe(true);
    expect(canEditEvaluationScores({
      id: 'user-1',
      role: 'Recruiter',
      modulePermissions: ['APPLICANTS_EDIT_SENSITIVE_OWN'],
    }, 'user-1')).toBe(true);
    expect(canEditEvaluationScores({
      id: 'user-1',
      role: 'Recruiter',
      modulePermissions: ['APPLICANTS_EDIT_SENSITIVE_OWN'],
    }, 'user-2')).toBe(false);

    expect(canEditEvaluationAttachments({
      id: 'user-1',
      role: 'Recruiter',
      modulePermissions: ['APPLICANTS_EDIT_BASIC_OWN'],
    }, 'user-1')).toBe(true);
    expect(canResetApplicantEvaluation({
      id: 'user-1',
      role: 'Recruiter',
      modulePermissions: ['APPLICANTS_EDIT_SENSITIVE_ALL'],
    })).toBe(true);
    expect(canRemoveEvaluationInterviewer({
      id: 'user-1',
      role: 'Recruiter',
      modulePermissions: ['POSITIONS_EDIT_DETAILED'],
    })).toBe(true);
  });

  it('builds evaluate header background styles', () => {
    expect(getEvaluateHeaderBackgroundStyle({
      type: 'image',
      image: '/hero.png',
      color: '220 25% 97%',
    })).toEqual({
      backgroundImage: 'url(/hero.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    });

    expect(getEvaluateHeaderBackgroundStyle({
      type: 'gradient',
      gradient: 'linear-gradient(hsl(1 2% 3%), hsl(4 5% 6%))',
      color: '220 25% 97%',
    })).toEqual({
      background: 'linear-gradient(hsl(1 2% 3%), hsl(4 5% 6%))',
    });

    expect(getEvaluateHeaderBackgroundStyle({
      type: 'solid',
      color: '10 20% 30%',
    })).toEqual({
      backgroundColor: 'hsl(10 20% 30%)',
    });

    expect(getEvaluateHeaderBackgroundColorForText({
      type: 'gradient',
      gradient: 'linear-gradient(hsl(1 2% 3%), hsl(4 5% 6%))',
      color: '220 25% 97%',
    })).toBe('hsl(1 2% 3%)');
  });
});
