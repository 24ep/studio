import type { MutableRefObject } from 'react';

import type { EvaluatePageJobAppliedOptions } from './evaluate-page-preferences-utils';
import type {
  EvaluationAttachment,
  EvaluationFormData,
  EvaluationPersonalityGroupConfig,
  EvaluationSummary,
  Interviewer,
  TestingResult,
} from './types';

export interface DesktopEvaluatePageProps {
  applicantId: string;
  applicantData: EvaluationFormData['applicant'] | null;
  attachments: EvaluationAttachment[];
  testingResults: TestingResult[];
  interviewers: Interviewer[];
  allEvaluations: Map<string, EvaluationSummary>;
  selectedInterviewerId: string | null;
  onInterviewerSelect: (id: string) => void;
  onTestResultUpdate?: (index: number, newScore: number) => void;
  onTestResultRemove?: (index: number) => void;
  onBack: () => void;
  appLogoUrl: string | null;
  evaluateHeaderBackgroundType: 'image' | 'gradient' | 'solid';
  evaluateHeaderBackgroundImage: string | null;
  evaluateHeaderBackgroundGradient: string | null;
  evaluateHeaderBackgroundColor: string;
  evaluateHeaderTextColor: string;
  remarkText?: string;
  onRemarkChange?: (text: string) => void;
  allDbPositions?: EvaluatePageJobAppliedOptions['positions'];
  availableStages?: EvaluatePageJobAppliedOptions['stages'];
  availableRecruiters?: Array<{ id: string; name: string }>;
  availableSources?: EvaluatePageJobAppliedOptions['sources'];
  onRefresh?: () => void;
  onStartEvaluate?: (traitId?: string) => void;
  canEditRemark?: boolean;
  interviewerSelectedBgColor?: string;
  interviewerSelectedTextColor?: string;
  interviewerSelectedBorderColor?: string;
  interviewerSelectedBorderWidth?: string;
  interviewerNonSelectedBgColor?: string;
  interviewerNonSelectedTextColor?: string;
  interviewerNonSelectedBorderColor?: string;
  interviewerNonSelectedBorderWidth?: string;
  interviewerNameColor?: string;
  canResetEvaluation?: boolean;
  canRemoveInterviewer?: boolean;
  positionId?: string | null;
  positionTitle?: string | null;
  onResetEvaluation?: (interviewerId: string, evaluationId: string) => void;
  onRemoveInterviewer?: (interviewerId: string) => void;
  formData: EvaluationFormData;
  personalityGroupsConfig: EvaluationPersonalityGroupConfig[];
  searchParams: Pick<URLSearchParams, 'get'>;
  canEditScores?: boolean;
  testingResultsRef?: MutableRefObject<TestingResult[]>;
}
