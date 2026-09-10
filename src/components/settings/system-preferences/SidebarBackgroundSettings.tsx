import type { ChangeEvent } from "react";

import type {
  SidebarBackgroundType,
  SidebarImageFit,
  SidebarImagePosition,
} from "./constants";
import {
  SidebarImageSettings,
  SidebarOptionSelect,
  SidebarPercentSlider,
} from "./SidebarBackgroundSettingsParts";
import { SIDEBAR_BACKGROUND_TYPE_OPTIONS } from "./sidebar-background-settings-options";
import { SystemPreferenceSection } from "./SystemPreferenceRows";

interface SidebarBackgroundSettingsProps {
  canEdit: boolean;
  sidebarBackgroundType: SidebarBackgroundType;
  setSidebarBackgroundType: (value: SidebarBackgroundType) => void;
  sidebarImagePreviewUrl: string | null;
  savedSidebarImageUrl: string | null;
  removeSelectedSidebarImage: (shouldRemoveSaved: boolean) => void;
  handleSidebarImageFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  sidebarImageFit: SidebarImageFit;
  setSidebarImageFit: (value: SidebarImageFit) => void;
  sidebarImagePosition: SidebarImagePosition;
  setSidebarImagePosition: (value: SidebarImagePosition) => void;
  sidebarBackgroundBlurPercent: number;
  setSidebarBackgroundBlurPercent: (value: number) => void;
  sidebarBackgroundTranslucencyPercent: number;
  setSidebarBackgroundTranslucencyPercent: (value: number) => void;
}

export function SidebarBackgroundSettings({
  canEdit,
  sidebarBackgroundType,
  setSidebarBackgroundType,
  sidebarImagePreviewUrl,
  savedSidebarImageUrl,
  removeSelectedSidebarImage,
  handleSidebarImageFileChange,
  sidebarImageFit,
  setSidebarImageFit,
  sidebarImagePosition,
  setSidebarImagePosition,
  sidebarBackgroundBlurPercent,
  setSidebarBackgroundBlurPercent,
  sidebarBackgroundTranslucencyPercent,
  setSidebarBackgroundTranslucencyPercent,
}: SidebarBackgroundSettingsProps) {
  return (
    <SystemPreferenceSection
      title="Background & Blur"
      description="Set the sidebar background style, transparency, and blur. Changes appear in the live sidebar preview."
    >
      <SidebarOptionSelect
        canEdit={canEdit}
        description="Choose a gradient, a solid background color, or an uploaded image. Set its colors in Sidebar Colors below."
        label="Background Type"
        value={sidebarBackgroundType}
        onValueChange={setSidebarBackgroundType}
        options={SIDEBAR_BACKGROUND_TYPE_OPTIONS}
        placeholder="Select background type"
      />

      {sidebarBackgroundType === "image" && (
        <SidebarImageSettings
          canEdit={canEdit}
          sidebarImagePreviewUrl={sidebarImagePreviewUrl}
          savedSidebarImageUrl={savedSidebarImageUrl}
          removeSelectedSidebarImage={removeSelectedSidebarImage}
          handleSidebarImageFileChange={handleSidebarImageFileChange}
          sidebarImageFit={sidebarImageFit}
          setSidebarImageFit={setSidebarImageFit}
          sidebarImagePosition={sidebarImagePosition}
          setSidebarImagePosition={setSidebarImagePosition}
        />
      )}

      <SidebarPercentSlider
        canEdit={canEdit}
        description="Softens the background layer while sidebar text and icons stay sharp."
        label="Background Blur"
        value={sidebarBackgroundBlurPercent}
        onValueChange={setSidebarBackgroundBlurPercent}
      />

      <SidebarPercentSlider
        canEdit={canEdit}
        description="Makes the sidebar background layer more see-through while keeping menu content opaque."
        label="Translucency"
        value={sidebarBackgroundTranslucencyPercent}
        onValueChange={setSidebarBackgroundTranslucencyPercent}
      />
    </SystemPreferenceSection>
  );
}
