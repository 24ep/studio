import AzureIntegrationTab from '@/components/settings/system-settings-tabs/AzureIntegrationTab';
import LoginMethodsTab from '@/components/settings/system-settings-tabs/LoginMethodsTab';
import BroadcastBannerTab from '@/components/settings/system-settings-tabs/BroadcastBannerTab';
import FeatureFlagsTab from '@/components/settings/system-settings-tabs/FeatureFlagsTab';
import MatchCriteriaTab from '@/components/settings/system-settings-tabs/MatchCriteriaTab';
import PwaTab from '@/components/settings/system-settings-tabs/PwaTab';
import type { SystemSettingsCorePanelProps } from './SystemSettingsCoreTabPanelTypes';

export function SystemSettingsPwaPanel({ settingsPage }: SystemSettingsCorePanelProps) {
  return (
    <PwaTab
      pwaEnabled={settingsPage.pwaEnabled}
      setPwaEnabled={settingsPage.setPwaEnabled}
      pwaName={settingsPage.pwaName}
      setPwaName={settingsPage.setPwaName}
      pwaShortName={settingsPage.pwaShortName}
      setPwaShortName={settingsPage.setPwaShortName}
      pwaDescription={settingsPage.pwaDescription}
      setPwaDescription={settingsPage.setPwaDescription}
      pwaThemeColor={settingsPage.pwaThemeColor}
      setPwaThemeColor={settingsPage.setPwaThemeColor}
      pwaBackgroundColor={settingsPage.pwaBackgroundColor}
      setPwaBackgroundColor={settingsPage.setPwaBackgroundColor}
      pwaAppleMobileWebAppTitle={settingsPage.pwaAppleMobileWebAppTitle}
      setPwaAppleMobileWebAppTitle={settingsPage.setPwaAppleMobileWebAppTitle}
      pwaAppleMobileWebAppStatusBarStyle={settingsPage.pwaAppleMobileWebAppStatusBarStyle}
      setPwaAppleMobileWebAppStatusBarStyle={settingsPage.setPwaAppleMobileWebAppStatusBarStyle}
      isSaving={settingsPage.isSaving}
    />
  );
}

export function SystemSettingsMatchCriteriaPanel({ settingsPage }: SystemSettingsCorePanelProps) {
  return (
    <MatchCriteriaTab
      defaultMatchCriteria={settingsPage.defaultMatchCriteria}
      setDefaultMatchCriteria={settingsPage.setDefaultMatchCriteria}
      isSaving={settingsPage.isSaving}
      isEditorReady={settingsPage.isEditorReady}
    />
  );
}

export function SystemSettingsFeatureFlagsPanel({ settingsPage }: SystemSettingsCorePanelProps) {
  return (
    <FeatureFlagsTab
      jobMatchFeatureEnabled={settingsPage.jobMatchFeatureEnabled}
      setJobMatchFeatureEnabled={settingsPage.setJobMatchFeatureEnabled}
      exportImportFeatureEnabled={settingsPage.exportImportFeatureEnabled}
      setExportImportFeatureEnabled={settingsPage.setExportImportFeatureEnabled}
      hiringManagerRestrictToAssignedPositions={settingsPage.hiringManagerRestrictToAssignedPositions}
      setHiringManagerRestrictToAssignedPositions={settingsPage.setHiringManagerRestrictToAssignedPositions}
      interviewInvitationFeatureEnabled={settingsPage.interviewInvitationFeatureEnabled}
      setInterviewInvitationFeatureEnabled={settingsPage.setInterviewInvitationFeatureEnabled}
      publicApplicationsEnabled={settingsPage.publicApplicationsEnabled}
      setPublicApplicationsEnabled={settingsPage.setPublicApplicationsEnabled}
      publicApplicationMode={settingsPage.publicApplicationMode}
      setPublicApplicationMode={settingsPage.setPublicApplicationMode}
      publicApplicationsRequireCaptcha={settingsPage.publicApplicationsRequireCaptcha}
      setPublicApplicationsRequireCaptcha={settingsPage.setPublicApplicationsRequireCaptcha}
      publicApplicationsSendApplicantConfirmation={settingsPage.publicApplicationsSendApplicantConfirmation}
      setPublicApplicationsSendApplicantConfirmation={settingsPage.setPublicApplicationsSendApplicantConfirmation}
      publicApplicationsNotifyRecruiter={settingsPage.publicApplicationsNotifyRecruiter}
      setPublicApplicationsNotifyRecruiter={settingsPage.setPublicApplicationsNotifyRecruiter}
      isSaving={settingsPage.isSaving}
    />
  );
}

export function SystemSettingsBroadcastBannerPanel({ settingsPage }: SystemSettingsCorePanelProps) {
  return (
    <BroadcastBannerTab
      activeId={settingsPage.broadcastBannerActiveId}
      broadcastEmailEnabled={settingsPage.broadcastEmailEnabled}
      broadcastSmsEnabled={settingsPage.broadcastSmsEnabled}
      broadcastSmsProvider={settingsPage.broadcastSmsProvider}
      broadcastSmsWebhookUrl={settingsPage.broadcastSmsWebhookUrl}
      broadcastSmsWebhookToken={settingsPage.broadcastSmsWebhookToken}
      broadcastSmsTwilioAccountSid={settingsPage.broadcastSmsTwilioAccountSid}
      broadcastSmsTwilioAuthToken={settingsPage.broadcastSmsTwilioAuthToken}
      broadcastSmsTwilioFromNumber={settingsPage.broadcastSmsTwilioFromNumber}
      setActiveId={settingsPage.setBroadcastBannerActiveId}
      setBroadcastEmailEnabled={settingsPage.setBroadcastEmailEnabled}
      setBroadcastSmsEnabled={settingsPage.setBroadcastSmsEnabled}
      setBroadcastSmsProvider={settingsPage.setBroadcastSmsProvider}
      setBroadcastSmsWebhookUrl={settingsPage.setBroadcastSmsWebhookUrl}
      setBroadcastSmsWebhookToken={settingsPage.setBroadcastSmsWebhookToken}
      setBroadcastSmsTwilioAccountSid={settingsPage.setBroadcastSmsTwilioAccountSid}
      setBroadcastSmsTwilioAuthToken={settingsPage.setBroadcastSmsTwilioAuthToken}
      setBroadcastSmsTwilioFromNumber={settingsPage.setBroadcastSmsTwilioFromNumber}
      isSaving={settingsPage.isSaving}
      banners={[
        {
          id: 'one',
          label: 'Banner 1',
          title: settingsPage.broadcastBannerOneTitle,
          message: settingsPage.broadcastBannerOneMessage,
          tone: settingsPage.broadcastBannerOneTone,
          setTitle: settingsPage.setBroadcastBannerOneTitle,
          setMessage: settingsPage.setBroadcastBannerOneMessage,
          setTone: settingsPage.setBroadcastBannerOneTone,
        },
        {
          id: 'two',
          label: 'Banner 2',
          title: settingsPage.broadcastBannerTwoTitle,
          message: settingsPage.broadcastBannerTwoMessage,
          tone: settingsPage.broadcastBannerTwoTone,
          setTitle: settingsPage.setBroadcastBannerTwoTitle,
          setMessage: settingsPage.setBroadcastBannerTwoMessage,
          setTone: settingsPage.setBroadcastBannerTwoTone,
        },
        {
          id: 'three',
          label: 'Banner 3',
          title: settingsPage.broadcastBannerThreeTitle,
          message: settingsPage.broadcastBannerThreeMessage,
          tone: settingsPage.broadcastBannerThreeTone,
          setTitle: settingsPage.setBroadcastBannerThreeTitle,
          setMessage: settingsPage.setBroadcastBannerThreeMessage,
          setTone: settingsPage.setBroadcastBannerThreeTone,
        },
      ]}
    />
  );
}

export function SystemSettingsAzurePanel({ settingsPage }: SystemSettingsCorePanelProps) {
  return (
    <AzureIntegrationTab
      azureAdClientId={settingsPage.azureAdClientId}
      setAzureAdClientId={settingsPage.setAzureAdClientId}
      azureAdClientSecret={settingsPage.azureAdClientSecret}
      setAzureAdClientSecret={settingsPage.setAzureAdClientSecret}
      azureAdTenantId={settingsPage.azureAdTenantId}
      setAzureAdTenantId={settingsPage.setAzureAdTenantId}
      azureMeetingRoomsEnabled={settingsPage.azureMeetingRoomsEnabled}
      setAzureMeetingRoomsEnabled={settingsPage.setAzureMeetingRoomsEnabled}
      showAzureSecret={settingsPage.showAzureSecret}
      setShowAzureSecret={settingsPage.setShowAzureSecret}
      testingAzureRooms={settingsPage.testingAzureRooms}
      setTestingAzureRooms={settingsPage.setTestingAzureRooms}
      isSaving={settingsPage.isSaving}
    />
  );
}

export function SystemSettingsLoginMethodsPanel({ settingsPage }: SystemSettingsCorePanelProps) {
  return (
    <LoginMethodsTab
      basicAuthEnabled={settingsPage.basicAuthEnabled}
      setBasicAuthEnabled={settingsPage.setBasicAuthEnabled}
      azureAdClientId={settingsPage.azureAdClientId}
      azureAdTenantId={settingsPage.azureAdTenantId}
      isSaving={settingsPage.isSaving}
    />
  );
}
