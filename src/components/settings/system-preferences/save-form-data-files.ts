import type { SystemPreferencesSaveInput } from './save-form-data-types';

export function appendSystemPreferenceFiles(
  formData: FormData,
  input: SystemPreferencesSaveInput,
) {
  if (input.selectedLoginImageFile) formData.append('loginBackgroundImage', input.selectedLoginImageFile);
  if (input.selectedLoginImageFileMobile) formData.append('loginPageBackgroundImageMobile', input.selectedLoginImageFileMobile);
  if (input.selectedEvaluateHeaderImageFile) formData.append('evaluateHeaderBackgroundImage', input.selectedEvaluateHeaderImageFile);
  if (input.selectedSidebarImageFile) formData.append('sidebarBackgroundImage', input.selectedSidebarImageFile);
  if (input.selectedSplashLogoFile) formData.append('splashLogoImage', input.selectedSplashLogoFile);
}
