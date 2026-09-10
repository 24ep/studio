export type EmailTemplateEditorMode = 'wysiwyg' | 'html';

export interface EmailTemplatesTabProps {
  emailTemplateInterviewInvitationSubject: string;
  setEmailTemplateInterviewInvitationSubject: (val: string) => void;
  emailTemplateInterviewInvitation: string;
  setEmailTemplateInterviewInvitation: (val: string) => void;
  emailTemplateInterviewInvitationEditorMode: EmailTemplateEditorMode;
  setEmailTemplateInterviewInvitationEditorMode: (val: EmailTemplateEditorMode) => void;
  emailTemplateOfferLetterSubject: string;
  setEmailTemplateOfferLetterSubject: (val: string) => void;
  emailTemplateOfferLetter: string;
  setEmailTemplateOfferLetter: (val: string) => void;
  emailTemplateOfferLetterEditorMode: EmailTemplateEditorMode;
  setEmailTemplateOfferLetterEditorMode: (val: EmailTemplateEditorMode) => void;
  icsDescriptionTemplate: string;
  setIcsDescriptionTemplate: (val: string) => void;
  emailEditorMode: EmailTemplateEditorMode;
  setEmailEditorMode: (val: EmailTemplateEditorMode) => void;
  isSaving: boolean;
  isEditorReady: boolean;
}
