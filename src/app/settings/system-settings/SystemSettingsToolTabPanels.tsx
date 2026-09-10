import { ScrollArea } from '@/components/ui/scroll-area';
import AutoCloseTab from '@/components/settings/AutoCloseTab';
import AIPowerSearchTab from '@/components/settings/AIPowerSearchTab';
import AiApiKeysTab from '@/components/settings/AiApiKeysTab';
import SystemApiKeysTab from '@/components/settings/SystemApiKeysTab';
import OrganizationTab from '@/components/settings/system-settings-tabs/OrganizationTab';
import MonitoringTab from '@/components/settings/system-settings-tabs/MonitoringTab';
import AiPromptsTab from '@/components/settings/system-settings-tabs/AiPromptsTab';
import DomainVerificationTab from '@/components/settings/system-settings-tabs/DomainVerificationTab';
import DigitalFootprintSettingsTab from '@/components/settings/DigitalFootprintSettingsTab';
import KnowledgeBaseConnectionTab from '@/components/settings/system-settings-tabs/KnowledgeBaseConnectionTab';
import type { SystemSettingsPageState } from './SystemSettingsTabContentTypes';

export function SystemSettingsToolTabPanels({ settingsPage }: { settingsPage: SystemSettingsPageState }) {
  const { activeTab } = settingsPage;

  return (
    <>
      {activeTab === 'auto-close' && (
        <ScrollArea className="h-full">
          <AutoCloseTab />
        </ScrollArea>
      )}

      {activeTab === 'ai-search' && (
        <ScrollArea className="h-full">
          <AIPowerSearchTab />
        </ScrollArea>
      )}

      {activeTab === 'ai-api-keys' && (
        <ScrollArea className="h-full">
          <AiApiKeysTab />
        </ScrollArea>
      )}

      {activeTab === 'ai-prompts' && <SystemSettingsAiPromptsPanel settingsPage={settingsPage} />}

      {activeTab === 'digital-footprint' && (
        <ScrollArea className="h-full"><DigitalFootprintSettingsTab /></ScrollArea>
      )}

      {activeTab === 'knowledge-base' && (
        <ScrollArea className="h-full">
          <KnowledgeBaseConnectionTab
            serviceDeskKnowledgeBaseUrl={settingsPage.serviceDeskKnowledgeBaseUrl}
            setServiceDeskKnowledgeBaseUrl={settingsPage.setServiceDeskKnowledgeBaseUrl}
            serviceDeskKnowledgeBaseApiKey={settingsPage.serviceDeskKnowledgeBaseApiKey}
            setServiceDeskKnowledgeBaseApiKey={settingsPage.setServiceDeskKnowledgeBaseApiKey}
            serviceDeskKnowledgeBaseCollectionName={settingsPage.serviceDeskKnowledgeBaseCollectionName}
            setServiceDeskKnowledgeBaseCollectionName={settingsPage.setServiceDeskKnowledgeBaseCollectionName}
            serviceDeskKnowledgeBaseRequestTimeoutMs={settingsPage.serviceDeskKnowledgeBaseRequestTimeoutMs}
            setServiceDeskKnowledgeBaseRequestTimeoutMs={settingsPage.setServiceDeskKnowledgeBaseRequestTimeoutMs}
            showServiceDeskKnowledgeBaseApiKey={settingsPage.showServiceDeskKnowledgeBaseApiKey}
            setShowServiceDeskKnowledgeBaseApiKey={settingsPage.setShowServiceDeskKnowledgeBaseApiKey}
            isSaving={settingsPage.isSaving}
          />
        </ScrollArea>
      )}

      {activeTab === 'system-api-keys' && settingsPage.isAdmin && (
        <ScrollArea className="h-full">
          <SystemApiKeysTab />
        </ScrollArea>
      )}

      {activeTab === 'monitoring' && <MonitoringTab />}

      {activeTab === 'organize' && <SystemSettingsOrganizationPanel settingsPage={settingsPage} />}

      {activeTab === 'domain-verification' && <SystemSettingsDomainVerificationPanel settingsPage={settingsPage} />}
    </>
  );
}

function SystemSettingsDomainVerificationPanel({ settingsPage }: { settingsPage: SystemSettingsPageState }) {
  return (
    <DomainVerificationTab
      employeeEmailDomain={settingsPage.organizationProfile.employeeEmailDomain}
      setEmployeeEmailDomain={value => settingsPage.setOrganizationProfile(current => ({
        ...current,
        employeeEmailDomain: value,
      }))}
      isSaving={settingsPage.isSaving}
    />
  );
}

function SystemSettingsAiPromptsPanel({ settingsPage }: { settingsPage: SystemSettingsPageState }) {
  return (
    <AiPromptsTab
      jobDescriptionSystemPrompt={settingsPage.jobDescriptionSystemPrompt}
      setJobDescriptionSystemPrompt={settingsPage.setJobDescriptionSystemPrompt}
      applicantEvaluationCriteriaPrompt={settingsPage.applicantEvaluationCriteriaPrompt}
      setApplicantEvaluationCriteriaPrompt={settingsPage.setApplicantEvaluationCriteriaPrompt}
      isSaving={settingsPage.isSaving}
    />
  );
}

function SystemSettingsOrganizationPanel({ settingsPage }: { settingsPage: SystemSettingsPageState }) {
  return (
    <OrganizationTab
      organizationName={settingsPage.organizationName}
      setOrganizationName={settingsPage.setOrganizationName}
      organizationAddress={settingsPage.organizationAddress}
      setOrganizationAddress={settingsPage.setOrganizationAddress}
      organizationContact={settingsPage.organizationContact}
      setOrganizationContact={settingsPage.setOrganizationContact}
      organizationProfile={settingsPage.organizationProfile}
      setOrganizationProfile={settingsPage.setOrganizationProfile}
      organizationLogoPreviewUrl={settingsPage.organizationLogoPreviewUrl}
      setOrganizationLogoPreviewUrl={settingsPage.setOrganizationLogoPreviewUrl}
      setSavedOrganizationLogoUrl={settingsPage.setSavedOrganizationLogoUrl}
      isSaving={settingsPage.isSaving}
    />
  );
}
