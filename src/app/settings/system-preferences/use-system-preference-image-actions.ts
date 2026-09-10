"use client";

import {
  createLogoImageActions,
  createTrackedSystemPreferenceImageActions,
} from "./system-preference-image-action-builders";
import type { UseSystemPreferenceImageActionsInput } from "./use-system-preference-image-action-types";
import { useSystemPreferenceImages } from "./use-system-preference-images";

export function useSystemPreferenceImageActions(input: UseSystemPreferenceImageActionsInput) {
  const imageTools = useSystemPreferenceImages({ showError: input.showError });

  return {
    cleanupObjectUrls: imageTools.cleanupObjectUrls,
    ...createLogoImageActions(input, imageTools),
    ...createTrackedSystemPreferenceImageActions(input, imageTools),
  };
}
