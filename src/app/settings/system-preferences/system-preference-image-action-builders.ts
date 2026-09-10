import type { ChangeEvent } from "react";

import type { useSystemPreferenceImages } from "./use-system-preference-images";
import type { UseSystemPreferenceImageActionsInput } from "./use-system-preference-image-action-types";

type SystemPreferenceImageTools = ReturnType<typeof useSystemPreferenceImages>;

export function createLogoImageActions(
  input: UseSystemPreferenceImageActionsInput,
  imageTools: SystemPreferenceImageTools
) {
  const handleLogoFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    await imageTools.uploadAndStoreImage(
      e,
      "app-logo",
      "Uploading primary logo...",
      input.setLogoPreviewUrl,
      input.setSavedLogoUrl,
      input.setSelectedLogoFile
    );
  };

  return {
    handleLogoFileChange,
    removeSelectedLogo: imageTools.createImageRemovalHandler(
      () => ({ previewUrl: input.logoPreviewUrl, savedUrl: input.savedLogoUrl }),
      input.setSelectedLogoFile,
      input.setLogoPreviewUrl,
      input.setSavedLogoUrl
    ),
    handleLoginPageLogoLightModeChange: imageTools.createUploadedImageChangeHandler(
      "settings",
      "Uploading login page logo (light)...",
      input.setLoginPageLogoLightModePreviewUrl,
      input.setSavedLoginPageLogoLightModeUrl
    ),
    handleLoginPageLogoDarkModeChange: imageTools.createUploadedImageChangeHandler(
      "settings",
      "Uploading login page logo (dark)...",
      input.setLoginPageLogoDarkModePreviewUrl,
      input.setSavedLoginPageLogoDarkModeUrl
    ),
    handleSidebarLogoCollapsedLightModeChange: imageTools.createUploadedImageChangeHandler(
      "settings",
      "Uploading sidebar collapsed logo (light)...",
      input.setSidebarLogoCollapsedLightModePreviewUrl,
      input.setSavedSidebarLogoCollapsedLightModeUrl
    ),
    handleSidebarLogoExpandedLightModeChange: imageTools.createUploadedImageChangeHandler(
      "settings",
      "Uploading sidebar expanded logo (light)...",
      input.setSidebarLogoExpandedLightModePreviewUrl,
      input.setSavedSidebarLogoExpandedLightModeUrl
    ),
    handleSidebarLogoCollapsedDarkModeChange: imageTools.createUploadedImageChangeHandler(
      "settings",
      "Uploading sidebar collapsed logo (dark)...",
      input.setSidebarLogoCollapsedDarkModePreviewUrl,
      input.setSavedSidebarLogoCollapsedDarkModeUrl
    ),
    handleSidebarLogoExpandedDarkModeChange: imageTools.createUploadedImageChangeHandler(
      "settings",
      "Uploading sidebar expanded logo (dark)...",
      input.setSidebarLogoExpandedDarkModePreviewUrl,
      input.setSavedSidebarLogoExpandedDarkModeUrl
    ),
  };
}

export function createTrackedSystemPreferenceImageActions(
  input: UseSystemPreferenceImageActionsInput,
  imageTools: SystemPreferenceImageTools
) {
  return {
    handleLoginImageFileChange: imageTools.createTrackedImageChangeHandler(
      input.setSelectedLoginImageFile,
      input.setLoginImagePreviewUrl
    ),
    removeSelectedLoginImage: imageTools.createImageRemovalHandler(
      () => ({ previewUrl: input.loginImagePreviewUrl, savedUrl: input.savedLoginImageDataUrl }),
      input.setSelectedLoginImageFile,
      input.setLoginImagePreviewUrl,
      input.setSavedLoginImageDataUrl
    ),
    handleLoginImageFileChangeMobile: imageTools.createTrackedImageChangeHandler(
      input.setSelectedLoginImageFileMobile,
      input.setLoginImagePreviewUrlMobile
    ),
    removeSelectedLoginImageMobile: imageTools.createImageRemovalHandler(
      () => ({ previewUrl: input.loginImagePreviewUrlMobile, savedUrl: input.savedLoginImageDataUrlMobile }),
      input.setSelectedLoginImageFileMobile,
      input.setLoginImagePreviewUrlMobile,
      input.setSavedLoginImageDataUrlMobile
    ),
    handleEvaluateHeaderImageFileChange: imageTools.createTrackedImageChangeHandler(
      input.setSelectedEvaluateHeaderImageFile,
      input.setEvaluateHeaderImagePreviewUrl
    ),
    removeSelectedEvaluateHeaderImage: imageTools.createImageRemovalHandler(
      () => ({
        previewUrl: input.evaluateHeaderImagePreviewUrl,
        savedUrl: input.savedEvaluateHeaderImageDataUrl,
      }),
      input.setSelectedEvaluateHeaderImageFile,
      input.setEvaluateHeaderImagePreviewUrl,
      input.setSavedEvaluateHeaderImageDataUrl,
      { restoreSavedPreview: false }
    ),
    handleHeaderImageFileChange: imageTools.createTrackedImageChangeHandler(
      input.setSelectedHeaderImageFile,
      input.setHeaderImagePreviewUrl
    ),
    removeSelectedHeaderImage: imageTools.createImageRemovalHandler(
      () => ({ previewUrl: input.headerImagePreviewUrl, savedUrl: input.savedHeaderImageDataUrl }),
      input.setSelectedHeaderImageFile,
      input.setHeaderImagePreviewUrl,
      input.setSavedHeaderImageDataUrl
    ),
    handleSidebarImageFileChange: imageTools.createTrackedImageChangeHandler(
      input.setSelectedSidebarImageFile,
      input.setSidebarImagePreviewUrl
    ),
    removeSelectedSidebarImage: imageTools.createImageRemovalHandler(
      () => ({ previewUrl: input.sidebarImagePreviewUrl, savedUrl: input.savedSidebarImageUrl }),
      input.setSelectedSidebarImageFile,
      input.setSidebarImagePreviewUrl,
      input.setSavedSidebarImageUrl
    ),
    handleSplashLogoChange: imageTools.createTrackedImageChangeHandler(
      input.setSelectedSplashLogoFile,
      input.setSplashLogoPreviewUrl
    ),
    removeSplashLogo: imageTools.createImageRemovalHandler(
      () => ({ previewUrl: input.splashLogoPreviewUrl, savedUrl: input.savedSplashLogoDataUrl }),
      input.setSelectedSplashLogoFile,
      input.setSplashLogoPreviewUrl,
      input.setSavedSplashLogoDataUrl
    ),
  };
}
