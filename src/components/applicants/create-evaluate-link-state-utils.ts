import { parseInitialInterviewDateTime } from './create-evaluate-link-date-utils';
import type {
  CreateEvaluateLinkInitialData,
  CreateEvaluateLinkModalResetState,
} from './create-evaluate-link-types';

export function getCreateEvaluateLinkEditState(initialData?: CreateEvaluateLinkInitialData | null) {
  const parsedInterviewDateTime = parseInitialInterviewDateTime(initialData?.interviewDateTime);

  return {
    interviewDate: parsedInterviewDateTime?.date,
    interviewTime: parsedInterviewDateTime?.time,
    location: initialData?.interviewLocation || undefined,
    selectedInterviewerIds: initialData?.interviewers?.length
      ? new Set(initialData.interviewers.map((interviewer) => interviewer.id))
      : undefined,
  };
}

export function getDefaultCreateEvaluateLinkModalState(): CreateEvaluateLinkModalResetState {
  return {
    currentStep: 'configure',
    interviewDate: undefined,
    interviewTime: '09:00',
    duration: 60,
    location: '',
    locationEmail: undefined,
    selectedInterviewerIds: new Set(),
    emailSubject: '',
    emailBody: '',
    linkInfo: null,
    expireDays: 7,
    requireLogin: true,
    sendEmail: true,
    copied: false,
    addInterviewerOpen: false,
    selectedUserIds: new Set(),
    isCustomLocation: false,
  };
}
