import { normalizeSystemSettingsResponse } from '../../../../lib/system-settings-response';

export type EvaluateHeaderBackgroundType = 'image' | 'gradient' | 'solid';

const DEFAULT_EVALUATE_HEADER_GRADIENT = 'linear-gradient(135deg, hsl(179 67% 66%), hsl(238 74% 61%))';
const EVALUATE_PREFERENCE_DEFAULTS = {
  evaluateHeaderBackgroundColor: '220 25% 97%',
  evaluateHeaderTextColor: '0 0% 0%',
  interviewerSelectedBackgroundColor: '220 25% 97%',
  interviewerSelectedTextColor: '0 0% 0%',
  interviewerSelectedBorderColor: '220 15% 50%',
  interviewerSelectedBorderWidth: '2px',
  interviewerNonSelectedBackgroundColor: '220 25% 97%',
  interviewerNonSelectedTextColor: '220 25% 50%',
  interviewerNonSelectedBorderColor: '220 15% 85%',
  interviewerNonSelectedBorderWidth: '1px',
  interviewerNameColor: '220 25% 30%',
} as const;

interface EvaluateHeaderStyleInput {
  type: EvaluateHeaderBackgroundType;
  image?: string | null;
  gradient?: string | null;
  color: string;
  fallbackColor?: string | null;
}

export interface EvaluatePageSystemPreferences {
  appLogoUrl: string | null;
  evaluateHeaderBackgroundType: EvaluateHeaderBackgroundType;
  evaluateHeaderBackgroundImage: string | null;
  evaluateHeaderBackgroundGradient: string;
  evaluateHeaderBackgroundColor: string;
  evaluateHeaderTextColor: string;
  interviewerSelectedBgColor: string;
  interviewerSelectedTextColor: string;
  interviewerSelectedBorderColor: string;
  interviewerSelectedBorderWidth: string;
  interviewerNonSelectedBgColor: string;
  interviewerNonSelectedTextColor: string;
  interviewerNonSelectedBorderColor: string;
  interviewerNonSelectedBorderWidth: string;
  interviewerNameColor: string;
}

export function getEvaluateHeaderBackgroundStyle({
  type,
  image,
  gradient,
  color,
  fallbackColor,
}: EvaluateHeaderStyleInput): Record<string, string> {
  if (type === 'image' && image) {
    return {
      backgroundImage: `url(${image})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    };
  }

  if (type === 'gradient') {
    return {
      background: gradient || DEFAULT_EVALUATE_HEADER_GRADIENT,
    };
  }

  if (type === 'solid') {
    return {
      backgroundColor: `hsl(${color})`,
    };
  }

  return {
    backgroundColor: fallbackColor || 'hsl(var(--background))',
  };
}

export function normalizeEvaluatePageSystemPreferences(settingsData: unknown): EvaluatePageSystemPreferences {
  const prefs = normalizeSystemSettingsResponse(settingsData);

  return {
    appLogoUrl: getEvaluateAppLogoUrl(prefs),
    evaluateHeaderBackgroundType: getEvaluateHeaderBackgroundTypePreference(prefs),
    evaluateHeaderBackgroundImage: getPreferenceString(prefs, 'evaluateHeaderBackgroundImageUrl') || null,
    evaluateHeaderBackgroundGradient: getEvaluateHeaderGradientPreference(prefs),
    evaluateHeaderBackgroundColor: getPreferenceStringOrDefault(prefs, 'evaluateHeaderBackgroundColor'),
    evaluateHeaderTextColor: getPreferenceStringOrDefault(prefs, 'evaluateHeaderTextColor'),
    interviewerSelectedBgColor: getPreferenceStringOrDefault(prefs, 'interviewerSelectedBackgroundColor'),
    interviewerSelectedTextColor: getPreferenceStringOrDefault(prefs, 'interviewerSelectedTextColor'),
    interviewerSelectedBorderColor: getPreferenceStringOrDefault(prefs, 'interviewerSelectedBorderColor'),
    interviewerSelectedBorderWidth: getPreferenceStringOrDefault(prefs, 'interviewerSelectedBorderWidth'),
    interviewerNonSelectedBgColor: getPreferenceStringOrDefault(prefs, 'interviewerNonSelectedBackgroundColor'),
    interviewerNonSelectedTextColor: getPreferenceStringOrDefault(prefs, 'interviewerNonSelectedTextColor'),
    interviewerNonSelectedBorderColor: getPreferenceStringOrDefault(prefs, 'interviewerNonSelectedBorderColor'),
    interviewerNonSelectedBorderWidth: getPreferenceStringOrDefault(prefs, 'interviewerNonSelectedBorderWidth'),
    interviewerNameColor: getPreferenceStringOrDefault(prefs, 'interviewerNameColor'),
  };
}

export function getEvaluateHeaderBackgroundColorForText({
  type,
  gradient,
  color,
}: Pick<EvaluateHeaderStyleInput, 'type' | 'gradient' | 'color'>) {
  if (type === 'solid') {
    return `hsl(${color})`;
  }

  if (type === 'gradient' && gradient) {
    const gradientMatch = gradient.match(/hsl\(([^)]+)\)/);
    if (gradientMatch) {
      return `hsl(${gradientMatch[1]})`;
    }

    return 'hsl(179 67% 66%)';
  }

  return `hsl(${color})`;
}

function getPreferenceString(prefs: Record<string, unknown>, key: string) {
  const value = prefs[key];
  return typeof value === 'string' && value.trim() !== '' ? value : undefined;
}

function getPreferenceStringOrDefault(
  prefs: Record<string, unknown>,
  key: keyof typeof EVALUATE_PREFERENCE_DEFAULTS,
) {
  return getPreferenceString(prefs, key) || EVALUATE_PREFERENCE_DEFAULTS[key];
}

function getEvaluateAppLogoUrl(prefs: Record<string, unknown>) {
  return getPreferenceString(prefs, 'evaluateReportLogoDataUrl') ||
    getPreferenceString(prefs, 'evaluatePlatformLogoDataUrl') ||
    getPreferenceString(prefs, 'appLogoDataUrl') ||
    null;
}

function getEvaluateHeaderBackgroundTypePreference(prefs: Record<string, unknown>): EvaluateHeaderBackgroundType {
  const value = getPreferenceString(prefs, 'evaluateHeaderBackgroundType');
  return value === 'image' || value === 'solid' || value === 'gradient' ? value : 'gradient';
}

function getEvaluateHeaderGradientPreference(prefs: Record<string, unknown>) {
  const gradient = getPreferenceString(prefs, 'evaluateHeaderBackgroundGradient');
  if (gradient) {
    return gradient;
  }

  const gradientStart = getPreferenceString(prefs, 'evaluateHeaderBackgroundGradientStart');
  const gradientEnd = getPreferenceString(prefs, 'evaluateHeaderBackgroundGradientEnd');
  if (gradientStart && gradientEnd) {
    return `linear-gradient(135deg, hsl(${gradientStart}), hsl(${gradientEnd}))`;
  }

  return DEFAULT_EVALUATE_HEADER_GRADIENT;
}
