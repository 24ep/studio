"use client";

import { useGlobalSettings } from "@/contexts/GlobalSettingsContext";
import { getBooleanSystemSetting } from "./security-protection-utils";
import { RightClickProtection } from "./RightClickProtection";
import { ScreenCaptureProtection } from "./ScreenCaptureProtection";

export function SystemProtectionFeatures() {
  const { settings } = useGlobalSettings();
  const rightClickProtectionEnabled = getBooleanSystemSetting(
    settings,
    "rightClickProtectionEnabled",
  );
  const screenCaptureProtectionEnabled = getBooleanSystemSetting(
    settings,
    "screenCaptureProtectionEnabled",
  );

  return (
    <>
      <RightClickProtection enabled={rightClickProtectionEnabled} />
      <ScreenCaptureProtection enabled={screenCaptureProtectionEnabled} />
    </>
  );
}
