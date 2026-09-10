import ProcessingTab from '@/components/settings/system-settings-tabs/ProcessingTab';
import SecurityControlsTab from '@/components/settings/system-settings-tabs/SecurityControlsTab';
import type { SystemSettingsCorePanelProps } from './SystemSettingsCoreTabPanelTypes';

export function SystemSettingsProcessingPanel({ settingsPage }: SystemSettingsCorePanelProps) {
  return (
    <ProcessingTab
      resumeProcessingMode={settingsPage.resumeProcessingMode}
      setResumeProcessingMode={settingsPage.setResumeProcessingMode}
      builtInProcessorNodeName={settingsPage.builtInProcessorNodeName}
      setBuiltInProcessorNodeName={settingsPage.setBuiltInProcessorNodeName}
      builtInResumeExtractionPrompt={settingsPage.builtInResumeExtractionPrompt}
      setBuiltInResumeExtractionPrompt={settingsPage.setBuiltInResumeExtractionPrompt}
      builtInApplicantMappingPrompt={settingsPage.builtInApplicantMappingPrompt}
      setBuiltInApplicantMappingPrompt={settingsPage.setBuiltInApplicantMappingPrompt}
      builtInJobMatchingPrompt={settingsPage.builtInJobMatchingPrompt}
      setBuiltInJobMatchingPrompt={settingsPage.setBuiltInJobMatchingPrompt}
      maxConcurrentProcessors={settingsPage.maxConcurrentProcessors}
      setMaxConcurrentProcessors={settingsPage.setMaxConcurrentProcessors}
      dataOperationsMaxConcurrentJobs={settingsPage.dataOperationsMaxConcurrentJobs}
      setDataOperationsMaxConcurrentJobs={settingsPage.setDataOperationsMaxConcurrentJobs}
      dataOperationsMaxQueuedJobsPerUser={settingsPage.dataOperationsMaxQueuedJobsPerUser}
      setDataOperationsMaxQueuedJobsPerUser={settingsPage.setDataOperationsMaxQueuedJobsPerUser}
      dataOperationsMaxImportFileSizeMb={settingsPage.dataOperationsMaxImportFileSizeMb}
      setDataOperationsMaxImportFileSizeMb={settingsPage.setDataOperationsMaxImportFileSizeMb}
      dataOperationsJobRetentionDays={settingsPage.dataOperationsJobRetentionDays}
      setDataOperationsJobRetentionDays={settingsPage.setDataOperationsJobRetentionDays}
      resumeProcessingWebhookUrl={settingsPage.resumeProcessingWebhookUrl}
      setResumeProcessingWebhookUrl={settingsPage.setResumeProcessingWebhookUrl}
      resumeProcessingWebhookToken={settingsPage.resumeProcessingWebhookToken}
      setResumeProcessingWebhookToken={settingsPage.setResumeProcessingWebhookToken}
      resumeProcessingWebhookResponseMode={settingsPage.resumeProcessingWebhookResponseMode}
      setResumeProcessingWebhookResponseMode={settingsPage.setResumeProcessingWebhookResponseMode}
      resumeProcessingWebhookTimeout={settingsPage.resumeProcessingWebhookTimeout}
      setResumeProcessingWebhookTimeout={settingsPage.setResumeProcessingWebhookTimeout}
      showWebhookToken={settingsPage.showWebhookToken}
      setShowWebhookToken={settingsPage.setShowWebhookToken}
      isSaving={settingsPage.isSaving}
    />
  );
}

export function SystemSettingsSecurityPanel({ settingsPage }: SystemSettingsCorePanelProps) {
  return (
    <SecurityControlsTab
      screenCaptureProtectionEnabled={settingsPage.screenCaptureProtectionEnabled}
      setScreenCaptureProtectionEnabled={settingsPage.setScreenCaptureProtectionEnabled}
      rightClickProtectionEnabled={settingsPage.rightClickProtectionEnabled}
      setRightClickProtectionEnabled={settingsPage.setRightClickProtectionEnabled}
      loginPageDevToolsProtectionEnabled={settingsPage.loginPageDevToolsProtectionEnabled}
      setLoginPageDevToolsProtectionEnabled={settingsPage.setLoginPageDevToolsProtectionEnabled}
      globalTwoFactorEnabled={settingsPage.globalTwoFactorEnabled}
      setGlobalTwoFactorEnabled={settingsPage.setGlobalTwoFactorEnabled}
      passwordSetupLinkExpiryHours={settingsPage.passwordSetupLinkExpiryHours}
      setPasswordSetupLinkExpiryHours={settingsPage.setPasswordSetupLinkExpiryHours}
      faultDetectionDeviceChangeEnabled={settingsPage.faultDetectionDeviceChangeEnabled}
      setFaultDetectionDeviceChangeEnabled={settingsPage.setFaultDetectionDeviceChangeEnabled}
      faultDetectionDeviceChangeThreshold={settingsPage.faultDetectionDeviceChangeThreshold}
      setFaultDetectionDeviceChangeThreshold={settingsPage.setFaultDetectionDeviceChangeThreshold}
      faultDetectionDeviceChangeWindowHours={settingsPage.faultDetectionDeviceChangeWindowHours}
      setFaultDetectionDeviceChangeWindowHours={settingsPage.setFaultDetectionDeviceChangeWindowHours}
      faultDetectionLocationSpoofingEnabled={settingsPage.faultDetectionLocationSpoofingEnabled}
      setFaultDetectionLocationSpoofingEnabled={settingsPage.setFaultDetectionLocationSpoofingEnabled}
      faultDetectionLocationMaxSpeedKmh={settingsPage.faultDetectionLocationMaxSpeedKmh}
      setFaultDetectionLocationMaxSpeedKmh={settingsPage.setFaultDetectionLocationMaxSpeedKmh}
      faultDetectionLocationMinDistanceKm={settingsPage.faultDetectionLocationMinDistanceKm}
      setFaultDetectionLocationMinDistanceKm={settingsPage.setFaultDetectionLocationMinDistanceKm}
      lockoutAlertEmails={settingsPage.lockoutAlertEmails}
      setLockoutAlertEmails={settingsPage.setLockoutAlertEmails}
      lockoutWebhookUrl={settingsPage.lockoutWebhookUrl}
      setLockoutWebhookUrl={settingsPage.setLockoutWebhookUrl}
      isSaving={settingsPage.isSaving}
    />
  );
}
