import type { SystemSetting } from '@/lib/types';
import type { MobileHeaderBackgroundType } from './signin-page-fetched-settings';
import { getSettingValue } from './signin-page-settings-background';

export interface MobileHeaderSettingsSetters {
  setMobileHeaderGradient1: (color: string) => void;
  setMobileHeaderGradient2: (color: string) => void;
  setMobileHeaderGradient3: (color: string) => void;
  setMobileHeaderGradient4: (color: string) => void;
  setMobileHeaderFontColor: (color: string) => void;
  setMobileHeaderBackgroundType: (type: MobileHeaderBackgroundType) => void;
  setMobileLoginLogoDataUrl: (url: string | null) => void;
}

interface ApplyMobileHeaderSettingsInput extends MobileHeaderSettingsSetters {
  initialSettings: SystemSetting[];
}

export function applyMobileHeaderSettings({
  initialSettings,
  setMobileHeaderGradient1,
  setMobileHeaderGradient2,
  setMobileHeaderGradient3,
  setMobileHeaderGradient4,
  setMobileHeaderFontColor,
  setMobileHeaderBackgroundType,
  setMobileLoginLogoDataUrl,
}: ApplyMobileHeaderSettingsInput) {
  setMobileHeaderGradient1(getSettingValue(initialSettings, 'mobileHeaderGradient1') || '#3B82F6');
  setMobileHeaderGradient2(getSettingValue(initialSettings, 'mobileHeaderGradient2') || '#2563EB');
  setMobileHeaderGradient3(getSettingValue(initialSettings, 'mobileHeaderGradient3') || '#1D4ED8');
  setMobileHeaderGradient4(getSettingValue(initialSettings, 'mobileHeaderGradient4') || '#1E40AF');
  setMobileHeaderFontColor(getSettingValue(initialSettings, 'mobileHeaderFontColor') || '#FFFFFF');
  setMobileHeaderBackgroundType((getSettingValue(initialSettings, 'mobileHeaderBackgroundType') as MobileHeaderBackgroundType) || 'gradient');
  setMobileLoginLogoDataUrl(getSettingValue(initialSettings, 'mobileLoginLogoDataUrl'));
}
