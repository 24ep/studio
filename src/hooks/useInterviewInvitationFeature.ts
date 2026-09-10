import { useState, useEffect } from 'react';
import {
  getSystemSettingEnum,
  isSystemSettingEnabled,
} from '@/lib/system-settings-response';

type InterviewInvitationEditorMode = 'wysiwyg' | 'html';

const INTERVIEW_INVITATION_FEATURE_KEY = 'interviewInvitationFeatureEnabled';
const INTERVIEW_INVITATION_EDITOR_MODE_KEY = 'emailTemplateInterviewInvitationEditorMode';
const EDITOR_MODE_OPTIONS: readonly InterviewInvitationEditorMode[] = ['wysiwyg', 'html'];

export const useInterviewInvitationFeature = () => {
  const [isInterviewInvitationEnabled, setIsInterviewInvitationEnabled] = useState<boolean>(true);
  const [editorMode, setEditorMode] = useState<InterviewInvitationEditorMode>('wysiwyg');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkInterviewInvitationFeature = async () => {
      try {
        const response = await fetch(`/api/settings/system-settings?keys=${INTERVIEW_INVITATION_FEATURE_KEY},${INTERVIEW_INVITATION_EDITOR_MODE_KEY}`);
        if (response.ok) {
          const data: unknown = await response.json();
          setIsInterviewInvitationEnabled(isSystemSettingEnabled(data, INTERVIEW_INVITATION_FEATURE_KEY, true));
          setEditorMode(getSystemSettingEnum(
            data,
            INTERVIEW_INVITATION_EDITOR_MODE_KEY,
            EDITOR_MODE_OPTIONS,
            'wysiwyg'
          ));
        }
      } catch (error) {
        console.error('Error checking interview invitation feature status:', error);
        // Default to enabled on error
        setIsInterviewInvitationEnabled(true);
      } finally {
        setIsLoading(false);
      }
    };

    checkInterviewInvitationFeature();
  }, []);

  return { isInterviewInvitationEnabled, editorMode, isLoading };
};

