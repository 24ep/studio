import React from "react";

import {
  APPEARANCE_DEVICE_TABS,
  getAppearanceDeviceTabClass,
  getDefaultLoginBackgroundGradient,
  type AppearanceDeviceTabId,
} from "./appearance-tab-utils";
import { AppearanceLoginBackgroundPanel } from "./AppearanceLoginBackgroundPanel";
import type { BrandingTabProps } from "./BrandingTabTypes";
import { SystemPreferenceSection } from "./SystemPreferenceRows";

export function BrandingLoginBackgroundSection({
  canEdit,
  loginBackgroundType,
  setLoginBackgroundType,
  loginImagePreviewUrl,
  removeSelectedLoginImage,
  handleLoginImageFileChange,
  loginBackgroundGradient,
  setLoginBackgroundGradient,
  loginBackgroundColor,
  setLoginBackgroundColor,
  loginBackgroundTypeMobile,
  setLoginBackgroundTypeMobile,
  loginImagePreviewUrlMobile,
  removeSelectedLoginImageMobile,
  handleLoginImageFileChangeMobile,
  loginBackgroundGradientMobile,
  setLoginBackgroundGradientMobile,
  loginBackgroundColorMobile,
  setLoginBackgroundColorMobile,
  loginLayoutType,
  setLoginLayoutType,
}: BrandingTabProps) {
  const [activeDevice, setActiveDevice] = React.useState<AppearanceDeviceTabId>("desktop");
  const defaultGradient = getDefaultLoginBackgroundGradient();

  return (
    <SystemPreferenceSection
      title="Login Page Background"
      description="Choose the background shown on the sign-in page for desktop and mobile devices."
    >
      <div className="mb-6 flex w-full border-b border-border/50">
        {APPEARANCE_DEVICE_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveDevice(tab.value)}
            className={getAppearanceDeviceTabClass(activeDevice === tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeDevice === "desktop" ? (
        <AppearanceLoginBackgroundPanel
          canEdit={canEdit}
          backgroundType={loginBackgroundType}
          setBackgroundType={setLoginBackgroundType}
          imagePreviewUrl={loginImagePreviewUrl}
          removeSelectedImage={removeSelectedLoginImage}
          handleImageFileChange={handleLoginImageFileChange}
          backgroundGradient={loginBackgroundGradient}
          setBackgroundGradient={setLoginBackgroundGradient}
          backgroundColor={loginBackgroundColor}
          setBackgroundColor={setLoginBackgroundColor}
          defaultGradient={defaultGradient}
          loginLayoutType={loginLayoutType}
          setLoginLayoutType={setLoginLayoutType}
        />
      ) : (
        <AppearanceLoginBackgroundPanel
          canEdit={canEdit}
          idSuffix="branding-mobile"
          isMobile
          backgroundType={loginBackgroundTypeMobile}
          setBackgroundType={setLoginBackgroundTypeMobile}
          imagePreviewUrl={loginImagePreviewUrlMobile}
          removeSelectedImage={removeSelectedLoginImageMobile}
          handleImageFileChange={handleLoginImageFileChangeMobile}
          backgroundGradient={loginBackgroundGradientMobile}
          setBackgroundGradient={setLoginBackgroundGradientMobile}
          backgroundColor={loginBackgroundColorMobile}
          setBackgroundColor={setLoginBackgroundColorMobile}
          defaultGradient={defaultGradient}
        />
      )}
    </SystemPreferenceSection>
  );
}
