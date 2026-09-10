import {
  DEFAULT_INTERVIEW_INVITATION_SUBJECT,
  DEFAULT_INTERVIEW_INVITATION_TEMPLATE,
} from './create-evaluate-link-email-template';
import {
  normalizeSystemSettingsResponse as normalizeSharedSystemSettingsResponse,
  type SystemSettingsRecord,
} from '../../lib/system-settings-response';

function getSettingsString(settings: SystemSettingsRecord, key: string) {
  const value = settings[key];
  return typeof value === 'string' && value.trim() !== '' ? value : undefined;
}

export function normalizeSystemSettingsResponse(data: unknown): SystemSettingsRecord {
  return normalizeSharedSystemSettingsResponse(data);
}

export function normalizeInterviewInvitationTemplateSettings(data: unknown) {
  const settings = normalizeSystemSettingsResponse(data);
  const editorMode = getSettingsString(settings, 'emailTemplateInterviewInvitationEditorMode');

  return {
    subject: getSettingsString(settings, 'emailTemplateInterviewInvitationSubject') || DEFAULT_INTERVIEW_INVITATION_SUBJECT,
    body: getSettingsString(settings, 'emailTemplateInterviewInvitation') || DEFAULT_INTERVIEW_INVITATION_TEMPLATE,
    appLogoUrl: getSettingsString(settings, 'qrCodeLogo') || getSettingsString(settings, 'appLogoDataUrl') || null,
    editorMode: editorMode === 'html' ? 'html' as const : 'wysiwyg' as const,
  };
}
