import EmailServerTab from '@/components/settings/system-settings-tabs/EmailServerTab';
import EmailTemplatesTab from '@/components/settings/system-settings-tabs/EmailTemplatesTab';
import type { SystemSettingsCorePanelProps } from './SystemSettingsCoreTabPanelTypes';

export function SystemSettingsEmailServerPanel({ settingsPage }: SystemSettingsCorePanelProps) {
  return (
    <EmailServerTab
      emailServiceEnabled={settingsPage.emailServiceEnabled}
      setEmailServiceEnabled={settingsPage.setEmailServiceEnabled}
      emailProvider={settingsPage.emailProvider}
      setEmailProvider={settingsPage.setEmailProvider}
      emailApiKey={settingsPage.emailApiKey}
      setEmailApiKey={settingsPage.setEmailApiKey}
      emailMailgunDomain={settingsPage.emailMailgunDomain}
      setEmailMailgunDomain={settingsPage.setEmailMailgunDomain}
      emailSmtpHost={settingsPage.emailSmtpHost}
      setEmailSmtpHost={settingsPage.setEmailSmtpHost}
      emailSmtpPort={settingsPage.emailSmtpPort}
      setEmailSmtpPort={settingsPage.setEmailSmtpPort}
      emailSmtpSecure={settingsPage.emailSmtpSecure}
      setEmailSmtpSecure={settingsPage.setEmailSmtpSecure}
      emailSmtpUser={settingsPage.emailSmtpUser}
      setEmailSmtpUser={settingsPage.setEmailSmtpUser}
      emailSmtpPassword={settingsPage.emailSmtpPassword}
      setEmailSmtpPassword={settingsPage.setEmailSmtpPassword}
      emailFromAddress={settingsPage.emailFromAddress}
      setEmailFromAddress={settingsPage.setEmailFromAddress}
      emailFromName={settingsPage.emailFromName}
      setEmailFromName={settingsPage.setEmailFromName}
      showSmtpPassword={settingsPage.showSmtpPassword}
      setShowSmtpPassword={settingsPage.setShowSmtpPassword}
      isSaving={settingsPage.isSaving}
      testingEmail={settingsPage.testingEmail}
      setTestingEmail={settingsPage.setTestingEmail}
    />
  );
}

export function SystemSettingsEmailTemplatesPanel({ settingsPage }: SystemSettingsCorePanelProps) {
  return (
    <EmailTemplatesTab
      emailTemplateInterviewInvitationSubject={settingsPage.emailTemplateInterviewInvitationSubject}
      setEmailTemplateInterviewInvitationSubject={settingsPage.setEmailTemplateInterviewInvitationSubject}
      emailTemplateInterviewInvitation={settingsPage.emailTemplateInterviewInvitation}
      setEmailTemplateInterviewInvitation={settingsPage.setEmailTemplateInterviewInvitation}
      emailTemplateInterviewInvitationEditorMode={settingsPage.emailTemplateInterviewInvitationEditorMode}
      setEmailTemplateInterviewInvitationEditorMode={settingsPage.setEmailTemplateInterviewInvitationEditorMode}
      emailTemplateOfferLetterSubject={settingsPage.emailTemplateOfferLetterSubject}
      setEmailTemplateOfferLetterSubject={settingsPage.setEmailTemplateOfferLetterSubject}
      emailTemplateOfferLetter={settingsPage.emailTemplateOfferLetter}
      setEmailTemplateOfferLetter={settingsPage.setEmailTemplateOfferLetter}
      emailTemplateOfferLetterEditorMode={settingsPage.emailTemplateOfferLetterEditorMode}
      setEmailTemplateOfferLetterEditorMode={settingsPage.setEmailTemplateOfferLetterEditorMode}
      icsDescriptionTemplate={settingsPage.icsDescriptionTemplate}
      setIcsDescriptionTemplate={settingsPage.setIcsDescriptionTemplate}
      emailEditorMode={settingsPage.emailEditorMode}
      setEmailEditorMode={settingsPage.setEmailEditorMode}
      isSaving={settingsPage.isSaving}
      isEditorReady={settingsPage.isEditorReady}
    />
  );
}
