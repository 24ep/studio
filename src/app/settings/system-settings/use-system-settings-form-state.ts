"use client";

import { useCallback, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import {
  DEFAULT_PWA_BACKGROUND_COLOR,
  DEFAULT_PWA_DESCRIPTION,
  DEFAULT_PWA_NAME,
  DEFAULT_PWA_SHORT_NAME,
  DEFAULT_PWA_STATUS_BAR_STYLE,
  DEFAULT_PWA_THEME_COLOR,
} from './system-settings-page-constants';
import { DEFAULT_ORGANIZATION_PROFILE } from '@/lib/organization-profile';
import type { EmailEditorMode, SystemSettingsViewState } from './system-settings-page-model';

type SystemSettingsFormValues = SystemSettingsViewState & {
  emailEditorMode: EmailEditorMode;
  showAzureSecret: boolean;
  showSmtpPassword: boolean;
  showServiceDeskKnowledgeBaseApiKey: boolean;
  showWebhookToken: boolean;
  testingAzureRooms: boolean;
  testingEmail: boolean;
};

type SystemSettingsFieldSetter<Key extends keyof SystemSettingsFormValues> = Dispatch<
  SetStateAction<SystemSettingsFormValues[Key]>
>;

type SystemSettingsFormSetters = {
  [Key in keyof SystemSettingsFormValues as `set${Capitalize<string & Key>}`]: SystemSettingsFieldSetter<Key>;
};

const DEFAULT_SYSTEM_SETTINGS_FORM_VALUES: SystemSettingsFormValues = {
  applicantEvaluationCriteriaPrompt: '',
  azureAdClientId: '',
  azureAdClientSecret: '',
  azureAdTenantId: '',
  basicAuthEnabled: true,
  azureMeetingRoomsEnabled: false,
  builtInApplicantMappingPrompt: 'Create or update an applicant profile from the extracted resume data. Preserve source evidence and leave unknown fields blank.',
  builtInJobMatchingPrompt: 'Match the applicant against available positions using skills, experience, education, and configured match criteria. Return fit score and concise reasons.',
  builtInProcessorNodeName: 'Default built-in processor',
  builtInResumeExtractionPrompt: 'Extract structured candidate data from the uploaded resume, including contact details, work history, education, skills, languages, and certifications.',
  broadcastEmailEnabled: false,
  broadcastBannerActiveId: 'none',
  broadcastBannerOneMessage: '',
  broadcastBannerOneTitle: 'Announcement',
  broadcastBannerOneTone: 'info',
  broadcastSmsEnabled: false,
  broadcastSmsProvider: 'webhook',
  broadcastSmsTwilioAccountSid: '',
  broadcastSmsTwilioAuthToken: '',
  broadcastSmsTwilioFromNumber: '',
  broadcastSmsWebhookToken: '',
  broadcastSmsWebhookUrl: '',
  broadcastBannerThreeMessage: '',
  broadcastBannerThreeTitle: 'Announcement',
  broadcastBannerThreeTone: 'critical',
  broadcastBannerTwoMessage: '',
  broadcastBannerTwoTitle: 'Announcement',
  broadcastBannerTwoTone: 'warning',
  defaultMatchCriteria: '',
  emailEditorMode: 'wysiwyg',
  emailFromAddress: '',
  emailFromName: '',
  emailServiceEnabled: false,
  emailProvider: 'smtp',
  emailApiKey: '',
  emailMailgunDomain: '',
  emailSmtpHost: '',
  emailSmtpPassword: '',
  emailSmtpPort: 587,
  emailSmtpSecure: false,
  emailSmtpUser: '',
  emailTemplateInterviewInvitation: '',
  emailTemplateInterviewInvitationEditorMode: 'wysiwyg',
  emailTemplateInterviewInvitationSubject: '',
  emailTemplateOfferLetter: '',
  emailTemplateOfferLetterEditorMode: 'wysiwyg',
  emailTemplateOfferLetterSubject: '',
  exportImportFeatureEnabled: true,
  globalTwoFactorEnabled: true,
  passwordSetupLinkExpiryHours: 48,
  faultDetectionDeviceChangeEnabled: true,
  faultDetectionDeviceChangeThreshold: 3,
  faultDetectionDeviceChangeWindowHours: 24,
  faultDetectionLocationSpoofingEnabled: true,
  faultDetectionLocationMaxSpeedKmh: 250,
  faultDetectionLocationMinDistanceKm: 10,
  hiringManagerRestrictToAssignedPositions: true,
  icsDescriptionTemplate: '',
  interviewInvitationFeatureEnabled: true,
  jobDescriptionSystemPrompt: '',
  jobMatchFeatureEnabled: true,
  lockoutAlertEmails: [],
  lockoutWebhookUrl: '',
  loginPageDevToolsProtectionEnabled: true,
  maxConcurrentProcessors: 5,
  dataOperationsMaxConcurrentJobs: 2,
  dataOperationsMaxQueuedJobsPerUser: 10,
  dataOperationsMaxImportFileSizeMb: 10,
  dataOperationsJobRetentionDays: 14,
  organizationAddress: '',
  organizationContact: '',
  organizationLogoPreviewUrl: null,
  organizationName: '',
  organizationProfile: DEFAULT_ORGANIZATION_PROFILE,
  processQueueEnabled: true,
  processorConnectionTimeoutMs: 30000,
  processorIntervalMs: 2000,
  processorQuietMode: false,
  processorRequestTimeoutMs: 1800000,
  publicApplicationsEnabled: true,
  publicApplicationMode: 'choice',
  publicApplicationsNotifyRecruiter: true,
  publicApplicationsRequireCaptcha: false,
  publicApplicationsSendApplicantConfirmation: true,
  serviceDeskKnowledgeBaseUrl: '',
  serviceDeskKnowledgeBaseApiKey: '',
  serviceDeskKnowledgeBaseCollectionName: 'service_desk_knowledge_chunks',
  serviceDeskKnowledgeBaseRequestTimeoutMs: 10000,
  pwaAppleMobileWebAppStatusBarStyle: DEFAULT_PWA_STATUS_BAR_STYLE,
  pwaAppleMobileWebAppTitle: DEFAULT_PWA_SHORT_NAME,
  pwaBackgroundColor: DEFAULT_PWA_BACKGROUND_COLOR,
  pwaDescription: DEFAULT_PWA_DESCRIPTION,
  pwaEnabled: false,
  pwaName: DEFAULT_PWA_NAME,
  pwaShortName: DEFAULT_PWA_SHORT_NAME,
  pwaThemeColor: DEFAULT_PWA_THEME_COLOR,
  resumeProcessingMode: 'built-in',
  resumeProcessingWebhookResponseMode: 'blocking',
  resumeProcessingWebhookTimeout: 1800,
  resumeProcessingWebhookToken: '',
  resumeProcessingWebhookUrl: '',
  rightClickProtectionEnabled: false,
  savedOrganizationLogoUrl: null,
  screenCaptureProtectionEnabled: false,
  showAzureSecret: false,
  showLogoOnly: false,
  showSmtpPassword: false,
  showServiceDeskKnowledgeBaseApiKey: false,
  showWebhookToken: false,
  testingAzureRooms: false,
  testingEmail: false,
};

const SETTER_KEYS = [
  'applicantEvaluationCriteriaPrompt',
  'azureAdClientId',
  'azureAdClientSecret',
  'azureAdTenantId',
  'basicAuthEnabled',
  'azureMeetingRoomsEnabled',
  'builtInApplicantMappingPrompt',
  'builtInJobMatchingPrompt',
  'builtInProcessorNodeName',
  'builtInResumeExtractionPrompt',
  'broadcastEmailEnabled',
  'broadcastBannerActiveId',
  'broadcastBannerOneMessage',
  'broadcastBannerOneTitle',
  'broadcastBannerOneTone',
  'broadcastSmsEnabled',
  'broadcastSmsProvider',
  'broadcastSmsTwilioAccountSid',
  'broadcastSmsTwilioAuthToken',
  'broadcastSmsTwilioFromNumber',
  'broadcastSmsWebhookToken',
  'broadcastSmsWebhookUrl',
  'broadcastBannerThreeMessage',
  'broadcastBannerThreeTitle',
  'broadcastBannerThreeTone',
  'broadcastBannerTwoMessage',
  'broadcastBannerTwoTitle',
  'broadcastBannerTwoTone',
  'defaultMatchCriteria',
  'emailEditorMode',
  'emailFromAddress',
  'emailFromName',
  'emailServiceEnabled',
  'emailProvider',
  'emailApiKey',
  'emailMailgunDomain',
  'emailSmtpHost',
  'emailSmtpPassword',
  'emailSmtpPort',
  'emailSmtpSecure',
  'emailSmtpUser',
  'emailTemplateInterviewInvitation',
  'emailTemplateInterviewInvitationEditorMode',
  'emailTemplateInterviewInvitationSubject',
  'emailTemplateOfferLetter',
  'emailTemplateOfferLetterEditorMode',
  'emailTemplateOfferLetterSubject',
  'exportImportFeatureEnabled',
  'globalTwoFactorEnabled',
  'passwordSetupLinkExpiryHours',
  'faultDetectionDeviceChangeEnabled',
  'faultDetectionDeviceChangeThreshold',
  'faultDetectionDeviceChangeWindowHours',
  'faultDetectionLocationSpoofingEnabled',
  'faultDetectionLocationMaxSpeedKmh',
  'faultDetectionLocationMinDistanceKm',
  'hiringManagerRestrictToAssignedPositions',
  'icsDescriptionTemplate',
  'interviewInvitationFeatureEnabled',
  'jobDescriptionSystemPrompt',
  'jobMatchFeatureEnabled',
  'lockoutAlertEmails',
  'lockoutWebhookUrl',
  'loginPageDevToolsProtectionEnabled',
  'maxConcurrentProcessors',
  'dataOperationsMaxConcurrentJobs',
  'dataOperationsMaxQueuedJobsPerUser',
  'dataOperationsMaxImportFileSizeMb',
  'dataOperationsJobRetentionDays',
  'organizationAddress',
  'organizationContact',
  'organizationLogoPreviewUrl',
  'organizationName',
  'organizationProfile',
  'publicApplicationsEnabled',
  'publicApplicationMode',
  'publicApplicationsNotifyRecruiter',
  'publicApplicationsRequireCaptcha',
  'publicApplicationsSendApplicantConfirmation',
  'pwaAppleMobileWebAppStatusBarStyle',
  'pwaAppleMobileWebAppTitle',
  'pwaBackgroundColor',
  'pwaDescription',
  'pwaEnabled',
  'pwaName',
  'pwaShortName',
  'pwaThemeColor',
  'resumeProcessingMode',
  'resumeProcessingWebhookResponseMode',
  'resumeProcessingWebhookTimeout',
  'resumeProcessingWebhookToken',
  'resumeProcessingWebhookUrl',
  'rightClickProtectionEnabled',
  'savedOrganizationLogoUrl',
  'serviceDeskKnowledgeBaseApiKey',
  'serviceDeskKnowledgeBaseCollectionName',
  'serviceDeskKnowledgeBaseRequestTimeoutMs',
  'serviceDeskKnowledgeBaseUrl',
  'screenCaptureProtectionEnabled',
  'showAzureSecret',
  'showServiceDeskKnowledgeBaseApiKey',
  'showSmtpPassword',
  'showWebhookToken',
  'testingAzureRooms',
  'testingEmail',
] as const;

export function useSystemSettingsFormState() {
  const [state, setState] = useState<SystemSettingsFormValues>(DEFAULT_SYSTEM_SETTINGS_FORM_VALUES);

  const setField = useCallback(<Key extends keyof SystemSettingsFormValues>(
    key: Key,
    value: SetStateAction<SystemSettingsFormValues[Key]>
  ) => {
    setState((currentState) => ({
      ...currentState,
      [key]: typeof value === 'function'
        ? (value as (previousValue: SystemSettingsFormValues[Key]) => SystemSettingsFormValues[Key])(currentState[key])
        : value,
    }));
  }, []);

  const setters = useMemo(() => (
    SETTER_KEYS.reduce((fieldSetters, key) => {
      const setterName = `set${capitalizeFieldName(key)}` as keyof SystemSettingsFormSetters;
      return {
        ...fieldSetters,
        [setterName]: (value: SetStateAction<SystemSettingsFormValues[typeof key]>) => setField(key, value),
      };
    }, {} as SystemSettingsFormSetters)
  ), [setField]);

  const applySystemSettingsViewState = useCallback((viewState: SystemSettingsViewState) => {
    setState((currentState) => ({
      ...currentState,
      ...viewState,
    }));
  }, []);

  return {
    ...state,
    ...setters,
    applySystemSettingsViewState,
  };
}

function capitalizeFieldName<Key extends string>(fieldName: Key): Capitalize<Key> {
  return `${fieldName.charAt(0).toUpperCase()}${fieldName.slice(1)}` as Capitalize<Key>;
}
