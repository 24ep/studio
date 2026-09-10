import type {
  CreateEvaluateLinkNextAction,
  CreateEvaluateLinkStep,
} from './create-evaluate-link-types';

export function getCreateEvaluateLinkNextAction({
  currentStep,
  invitationEnabled,
  sendEmail,
}: {
  currentStep: CreateEvaluateLinkStep;
  invitationEnabled: boolean;
  sendEmail: boolean;
}): CreateEvaluateLinkNextAction {
  if (currentStep === 'configure') {
    return invitationEnabled && sendEmail
      ? { nextStep: 'email', shouldCreateLink: false, skipEmail: true }
      : { shouldCreateLink: true, skipEmail: true };
  }

  if (currentStep === 'email') {
    return { shouldCreateLink: true, skipEmail: false };
  }

  return { shouldCreateLink: false, skipEmail: false };
}

export function shouldSendCreateEvaluateLinkInvitation({
  skipEmail,
  sendEmail,
  invitationEnabled,
  selectedInterviewerCount,
}: {
  skipEmail: boolean;
  sendEmail: boolean;
  invitationEnabled: boolean;
  selectedInterviewerCount: number;
}) {
  return !skipEmail && sendEmail && invitationEnabled && selectedInterviewerCount > 0;
}

export function getCreateEvaluateLinkSteps(invitationEnabled: boolean, sendEmail: boolean) {
  const configureStep = { id: 'configure' as const, label: 'Configure' };
  const successStep = { id: 'success' as const, label: 'Done' };

  return invitationEnabled && sendEmail
    ? [configureStep, { id: 'email' as const, label: 'Email' }, successStep]
    : [configureStep, successStep];
}

export function getStepIndex(steps: Array<{ id: CreateEvaluateLinkStep }>, currentStep: CreateEvaluateLinkStep): number {
  return steps.findIndex((step) => step.id === currentStep);
}
