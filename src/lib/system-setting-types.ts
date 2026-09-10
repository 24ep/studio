// System-wide settings.

export type SystemSettingKey =
  | 'appName'
  | 'appLogoDataUrl'
  | 'appFaviconDataUrl'
  | 'appThemePreference'
  | 'defaultMatchCriteria'
  // New contextual logo settings
  | 'loginPageLogoLightMode'
  | 'loginPageLogoDarkMode'
  | 'sidebarLogoCollapsedLightMode'
  | 'sidebarLogoExpandedLightMode'
  | 'sidebarLogoCollapsedDarkMode'
  | 'sidebarLogoExpandedDarkMode'
  | 'primaryGradientStart' // Legacy - kept for backward compatibility
  | 'primaryGradientEnd' // Legacy - kept for backward compatibility
  | 'primaryGradient' // Full gradient string with all stops
  | 'primaryButtonShadowL' // Primary button shadow light theme
  | 'primaryButtonShadowHoverL' // Primary button shadow hover light theme
  | 'primaryButtonShadowD' // Primary button shadow dark theme
  | 'primaryButtonShadowHoverD' // Primary button shadow hover dark theme
  | 'loginBackgroundGradient' // Full gradient string with all stops
  | 'evaluateHeaderBackgroundGradient' // Full gradient string with all stops
  | 'evaluateHeaderBackgroundType'
  | 'evaluateHeaderBackgroundImageUrl'
  | 'evaluateHeaderBackgroundGradientStart'
  | 'evaluateHeaderBackgroundGradientEnd'
  | 'evaluateHeaderBackgroundColor'
  | 'evaluateHeaderTextColor'
  | 'evaluatePlatformLogoDataUrl'
  | 'evaluateReportLogoDataUrl'
  // Organization branding
  | 'organizationName'
  | 'organizationAddress'
  | 'organizationContact'
  | 'organizationProfile'
  | 'organizationLogoDataUrl'
  | 'resumeProcessingMode'
  | 'builtInProcessorNodeName'
  | 'builtInResumeExtractionPrompt'
  | 'builtInApplicantMappingPrompt'
  | 'builtInJobMatchingPrompt'
  | 'resumeProcessingWebhookUrl'
  | 'resumeProcessingWebhookToken'
  | 'resumeProcessingWebhookResponseMode'
  | 'resumeProcessingWebhookTimeout'
  | 'webhookConnectionTimeout'
  | 'preventDuplicateWebhookProcessing'
  | 'geminiApiKey'
  | 'openaiApiKey'
  | 'deepseekApiKey'
  | 'loginPageBackgroundType'
  | 'loginPageBackgroundImageUrl'
  | 'loginPageBackgroundColor1'
  | 'loginPageBackgroundColor2'
  | 'loginPageLayoutType'
  | 'loginPageLogoSize'
  // Branding display settings
  | 'showLogoOnly'
  // Unified Login Background settings
  | 'loginBackgroundType'
  | 'loginBackgroundGradientStart'
  | 'loginBackgroundGradientEnd'
  | 'loginBackgroundColor'
  // Unified Mobile Login Background settings
  | 'loginBackgroundTypeMobile'
  | 'loginPageBackgroundImageUrlMobile'
  | 'loginBackgroundGradientStartMobile'
  | 'loginBackgroundGradientEndMobile'
  | 'loginBackgroundColorMobile'
  | 'loginBackgroundGradientMobile'
  // Sidebar Light Theme
  | 'sidebarBgStartL'
  | 'sidebarBgEndL'
  | 'sidebarTextL'
  | 'sidebarActiveBgStartL'
  | 'sidebarActiveBgEndL'
  | 'sidebarActiveTextL'
  | 'sidebarHoverBgL'
  | 'sidebarHoverTextL'
  | 'sidebarBorderL'
  // Button text colors - separate from sidebar active text
  | 'buttonTextColorL'
  | 'buttonTextColorD'
  // Sidebar Dark Theme
  | 'sidebarBgStartD'
  | 'sidebarBgEndD'
  | 'sidebarTextD'
  | 'sidebarActiveBgStartD'
  | 'sidebarActiveBgEndD'
  | 'sidebarActiveTextD'
  | 'sidebarHoverBgD'
  | 'sidebarHoverTextD'
  | 'sidebarBorderD'
  | 'appFontFamily'
  | 'loginPageContent'
  | 'loginPageFooter'
  | 'maxConcurrentProcessors'
  | 'aiPowerSearchSystemPrompt'
  | 'applicantEvaluationCriteriaPrompt'
  | 'aiProviderSelection'
  | 'geminiModelSelection'
  | 'openaiModelSelection'
  | 'deepseekModelSelection'
  | 'jobMatchFeatureEnabled'
  | 'publicApplicationsEnabled'
  | 'publicApplicationsRequireCaptcha'
  | 'publicApplicationsSendApplicantConfirmation'
  | 'publicApplicationsNotifyRecruiter'
  | 'basicAuthEnabled'
  | 'processQueueEnabled'
  | 'queueRetryEnabled'
  | 'queueRetryDelaySeconds'
  | 'queueMaxRetries'
  // Email Service Configuration
  | 'emailServiceEnabled'
  | 'emailSmtpHost'
  | 'emailSmtpPort'
  | 'emailSmtpSecure'
  | 'emailSmtpUser'
  | 'emailSmtpPassword'
  | 'emailFromAddress'
  | 'emailFromName'
  | 'lockoutAlertEmails'
  | 'lockoutWebhookUrl'
  // Email Templates
  | 'emailTemplateInterviewInvitation'
  | 'emailTemplateInterviewInvitationSubject'
  | 'emailTemplateOfferLetter'
  | 'emailTemplateOfferLetterSubject'
  // Feature Toggles
  | 'interviewInvitationFeatureEnabled'
  | 'pwaEnabled'
  // Drawer Style
  | 'drawerStyle'
  // QR Code
  | 'qrCodeLogo'
  // Sidebar Logo Size
  | 'sidebarLogoSize'
  | 'sidebarNavigationMode'
  | 'sidebarSecondaryGroupLabels'
  // Mobile Header Configuration
  | 'mobileHeaderGradient1'
  | 'mobileHeaderGradient2'
  | 'mobileHeaderGradient3'
  | 'mobileHeaderGradient4'
  | 'mobileHeaderFontColor'
  | 'mobileLoginLogoDataUrl'
  | 'mobileHeaderBackgroundType'
  | 'emailTemplateInterviewInvitationEditorMode'
  | 'emailTemplateOfferLetterEditorMode'
  | 'icsDescriptionTemplate'
  // Security settings
  | 'loginPageDevToolsProtectionEnabled' // Disable dev tools and right-click on login page (default: true = protection enabled)
  | 'rightClickProtectionEnabled' // Disable right-click across entire application (default: false = protection disabled)
  | 'screenCaptureProtectionEnabled' // Blur content when tab loses focus to protect against screen capture (default: false = protection disabled)
  | 'learningCourseCategories';

export interface SystemSetting {
  key: SystemSettingKey;
  value: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type LoginPageBackgroundType = 'default' | 'image' | 'color' | 'gradient' | 'solid';
export type LoginPageLayoutType = 'center' | '2column';
