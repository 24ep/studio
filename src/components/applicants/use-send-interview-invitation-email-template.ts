import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

import type { SendInterviewInvitationStep } from './SendInterviewInvitationStepIndicator';
import {
  DEFAULT_INTERVIEW_INVITATION_BODY,
  DEFAULT_INTERVIEW_INVITATION_SUBJECT,
  fetchInterviewEmailTemplate,
} from './send-interview-invitation-api';

export function useSendInterviewInvitationEmailTemplate({
  currentStep,
  isOpen,
}: {
  currentStep: SendInterviewInvitationStep;
  isOpen: boolean;
}) {
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [emailEditorMode, setEmailEditorMode] = useState<'wysiwyg' | 'html'>('wysiwyg');

  const loadEmailTemplate = useCallback(async () => {
    setLoadingTemplate(true);
    try {
      const template = await fetchInterviewEmailTemplate();
      setEmailSubject(template.subject);
      setEmailBody(template.body);
    } catch (err) {
      console.error('Error loading email template:', err);
      toast.error('Failed to load email template');
      setEmailSubject(DEFAULT_INTERVIEW_INVITATION_SUBJECT);
      setEmailBody(DEFAULT_INTERVIEW_INVITATION_BODY);
    } finally {
      setLoadingTemplate(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && currentStep === 'edit-email' && !emailBody) {
      void loadEmailTemplate();
    }
  }, [currentStep, emailBody, isOpen, loadEmailTemplate]);

  const resetEmailTemplate = useCallback(() => {
    setEmailSubject('');
    setEmailBody('');
    setEmailEditorMode('wysiwyg');
  }, []);

  return {
    emailBody,
    emailEditorMode,
    emailSubject,
    loadingTemplate,
    resetEmailTemplate,
    setEmailBody,
    setEmailEditorMode,
    setEmailSubject,
  };
}
