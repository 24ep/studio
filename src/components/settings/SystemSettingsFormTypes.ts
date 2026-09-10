import type { SystemSetting } from "@/lib/types";

export interface SystemSettingsFormProps {
  open: boolean;
  setting: SystemSetting | null;
  onClose: () => void;
  onSubmit: (data: SystemSetting[]) => void;
  isSaving?: boolean;
}

export const DEFAULT_SYSTEM_SETTING: SystemSetting = {
  key: "appName",
  value: null,
};

const SYSTEM_SETTING_KEYS = [
  "appName", "appLogoDataUrl", "appFaviconDataUrl", "appThemePreference",
  "defaultMatchCriteria",
  "loginPageLogoLightMode", "loginPageLogoDarkMode",
  "sidebarLogoCollapsedLightMode", "sidebarLogoExpandedLightMode",
  "sidebarLogoCollapsedDarkMode", "sidebarLogoExpandedDarkMode",
  "primaryGradientStart", "primaryGradientEnd",
  "mobileLoginLogoDataUrl", "mobileHeaderBackgroundType", "mobileHeaderFontColor",
  "generalPdfWebhookUrl", "geminiApiKey",
  "loginPageBackgroundType", "loginPageBackgroundImageUrl",
  "loginPageBackgroundColor1", "loginPageBackgroundColor2",
  "loginPageLayoutType",
  "themePreference", "loginBackgroundType", "loginBackgroundGradientStart",
  "loginBackgroundGradientEnd", "loginBackgroundColor",
  "jobMatchFeatureEnabled",
  "pwaEnabled",
  "pwaName",
  "pwaShortName",
  "icsDescriptionTemplate",
  "collapsedSidebarLogoSize",
  "emailTemplateInterviewInvitationEditorMode",
  "pwaDescription",
  "pwaThemeColor",
  "pwaBackgroundColor",
  "pwaAppleMobileWebAppTitle",
  "pwaAppleMobileWebAppStatusBarStyle",
  "sidebarBgStartL", "sidebarBgEndL", "sidebarTextL",
  "sidebarActiveBgStartL", "sidebarActiveBgEndL", "sidebarActiveTextL",
  "sidebarHoverBgL", "sidebarHoverTextL", "sidebarBorderL",
  "buttonTextColorL", "buttonTextColorD",
  "sidebarBgStartD", "sidebarBgEndD", "sidebarTextD",
  "sidebarActiveBgStartD", "sidebarActiveBgEndD", "sidebarActiveTextD",
  "sidebarHoverBgD", "sidebarHoverTextD", "sidebarBorderD",
  "sidebarFontFamilyL", "sidebarFontSizeL", "sidebarFontWeightL", "sidebarLineHeightL", "sidebarLetterSpacingL", "sidebarTextTransformL",
  "sidebarFontFamilyD", "sidebarFontSizeD", "sidebarFontWeightD", "sidebarLineHeightD", "sidebarLetterSpacingD", "sidebarTextTransformD",
  "sidebarBorderWidthL", "sidebarBorderStyleL", "sidebarBorderRadiusL", "sidebarShadowL", "sidebarShadowHoverL", "sidebarShadowActiveL",
  "sidebarBorderWidthD", "sidebarBorderStyleD", "sidebarBorderRadiusD", "sidebarShadowD", "sidebarShadowHoverD", "sidebarShadowActiveD",
  "sidebarPaddingXL", "sidebarPaddingYL", "sidebarMarginL", "sidebarGapL", "sidebarWidthL", "sidebarWidthCollapsedL", "sidebarTransitionDurationL", "sidebarTransitionTimingL",
  "sidebarPaddingXD", "sidebarPaddingYD", "sidebarMarginD", "sidebarGapD", "sidebarWidthD", "sidebarWidthCollapsedD", "sidebarTransitionDurationD", "sidebarTransitionTimingD",
  "sidebarMenuItemBgL", "sidebarMenuItemBgHoverL", "sidebarMenuItemBgActiveL", "sidebarMenuItemColorL", "sidebarMenuItemColorHoverL", "sidebarMenuItemColorActiveL",
  "sidebarMenuItemBorderL", "sidebarMenuItemBorderHoverL", "sidebarMenuItemBorderActiveL", "sidebarMenuItemBorderRadiusL", "sidebarMenuItemPaddingXL", "sidebarMenuItemPaddingYL",
  "sidebarMenuItemMarginL", "sidebarMenuItemFontWeightL", "sidebarMenuItemFontWeightActiveL", "sidebarMenuItemFontSizeL", "sidebarMenuItemLineHeightL", "sidebarMenuItemTransitionL",
  "sidebarMenuItemBgD", "sidebarMenuItemBgHoverD", "sidebarMenuItemBgActiveD", "sidebarMenuItemColorD", "sidebarMenuItemColorHoverD", "sidebarMenuItemColorActiveD",
  "sidebarMenuItemBorderD", "sidebarMenuItemBorderHoverD", "sidebarMenuItemBorderActiveD", "sidebarMenuItemBorderRadiusD", "sidebarMenuItemPaddingXD", "sidebarMenuItemPaddingYD",
  "sidebarMenuItemMarginD", "sidebarMenuItemFontWeightD", "sidebarMenuItemFontWeightActiveD", "sidebarMenuItemFontSizeD", "sidebarMenuItemLineHeightD", "sidebarMenuItemTransitionD",
  "sidebarIconSizeL", "sidebarIconColorL", "sidebarIconColorHoverL", "sidebarIconColorActiveL", "sidebarIconMarginRightL", "sidebarIconTransitionL",
  "sidebarIconSizeD", "sidebarIconColorD", "sidebarIconColorHoverD", "sidebarIconColorActiveD", "sidebarIconMarginRightD", "sidebarIconTransitionD",
  "sidebarGroupLabelColorL", "sidebarGroupLabelFontSizeL", "sidebarGroupLabelFontWeightL", "sidebarGroupLabelTextTransformL", "sidebarGroupLabelLetterSpacingL", "sidebarGroupLabelPaddingL", "sidebarGroupLabelMarginL",
  "sidebarGroupLabelColorD", "sidebarGroupLabelFontSizeD", "sidebarGroupLabelFontWeightD", "sidebarGroupLabelTextTransformD", "sidebarGroupLabelLetterSpacingD", "sidebarGroupLabelPaddingD", "sidebarGroupLabelMarginD",
  "appFontFamily",
  "loginPageContent",
  "loginPageFooter",
  "maxConcurrentProcessors",
  "aiPowerSearchSystemPrompt",
  "applicantEvaluationCriteriaPrompt",
  "organizationName", "organizationAddress", "organizationContact", "organizationProfile", "organizationLogoDataUrl",
  "screenCaptureProtectionEnabled", "rightClickProtectionEnabled",
  "queueRetryEnabled", "queueRetryDelaySeconds", "queueMaxRetries",
  "azureAdClientId", "azureAdClientSecret", "azureAdTenantId",
  "basicAuthEnabled",
];

export const ALLOWED_SYSTEM_SETTING_KEYS = Array.from(new Set(SYSTEM_SETTING_KEYS));
