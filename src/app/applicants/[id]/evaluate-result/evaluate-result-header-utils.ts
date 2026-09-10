import type { CSSProperties } from "react";

export const DEFAULT_EVALUATE_HEADER_GRADIENT = "linear-gradient(135deg, hsl(179 67% 66%), hsl(238 74% 61%))";

interface EvaluateResultSettingsMap {
  [key: string]: unknown;
}

export interface EvaluateResultHeaderSettings {
  appLogoUrl: string | null;
  organizationLogoUrl: string | null;
  organizationName: string | null;
  organizationAddress: string | null;
  organizationContact: string | null;
  evaluateHeaderBackgroundType: "image" | "gradient" | "solid";
  evaluateHeaderBackgroundImage: string | null;
  evaluateHeaderBackgroundGradient: string;
  evaluateHeaderBackgroundColor: string;
  evaluateHeaderTextColor: string;
}

export function normalizeEvaluateResultSettingsPayload(settingsData: unknown): EvaluateResultSettingsMap {
  if (!settingsData || typeof settingsData !== "object") {
    return {};
  }

  const settings = (settingsData as { settings?: unknown }).settings;
  if (Array.isArray(settings)) {
    return Object.fromEntries(
      settings
        .filter((setting): setting is { key: string; value: unknown } => (
          !!setting &&
          typeof setting === "object" &&
          typeof (setting as { key?: unknown }).key === "string"
        ))
        .map((setting) => [setting.key, setting.value]),
    );
  }

  return settingsData as EvaluateResultSettingsMap;
}

function getStringSetting(settings: EvaluateResultSettingsMap, key: string) {
  return typeof settings[key] === "string" ? settings[key] as string : null;
}

export function normalizeEvaluateResultHeaderSettings(settingsData: unknown): EvaluateResultHeaderSettings {
  const prefs = normalizeEvaluateResultSettingsPayload(settingsData);
  const appLogoUrl = getStringSetting(prefs, "evaluateReportLogoDataUrl") ||
    getStringSetting(prefs, "evaluatePlatformLogoDataUrl") ||
    getStringSetting(prefs, "appLogoDataUrl");
  const organizationLogoUrl = getStringSetting(prefs, "organizationLogoDataUrl") ||
    appLogoUrl;
  const gradient = getEvaluateHeaderGradient(prefs);

  return {
    appLogoUrl,
    organizationLogoUrl,
    organizationName: getStringSetting(prefs, "organizationName"),
    organizationAddress: getStringSetting(prefs, "organizationAddress"),
    organizationContact: getStringSetting(prefs, "organizationContact"),
    evaluateHeaderBackgroundType: (getStringSetting(prefs, "evaluateHeaderBackgroundType") as "image" | "gradient" | "solid") || "gradient",
    evaluateHeaderBackgroundImage: getStringSetting(prefs, "evaluateHeaderBackgroundImageUrl"),
    evaluateHeaderBackgroundGradient: gradient,
    evaluateHeaderBackgroundColor: getStringSetting(prefs, "evaluateHeaderBackgroundColor") || "220 25% 97%",
    evaluateHeaderTextColor: getStringSetting(prefs, "evaluateHeaderTextColor") || "0 0% 0%",
  };
}

function getEvaluateHeaderGradient(settings: EvaluateResultSettingsMap) {
  const explicitGradient = getStringSetting(settings, "evaluateHeaderBackgroundGradient");
  if (explicitGradient) {
    return explicitGradient;
  }

  const gradientStart = getStringSetting(settings, "evaluateHeaderBackgroundGradientStart");
  const gradientEnd = getStringSetting(settings, "evaluateHeaderBackgroundGradientEnd");
  if (gradientStart && gradientEnd) {
    return `linear-gradient(135deg, hsl(${gradientStart}), hsl(${gradientEnd}))`;
  }

  return DEFAULT_EVALUATE_HEADER_GRADIENT;
}

export function getEvaluateResultHeaderBackgroundStyle({
  evaluateHeaderBackgroundType,
  evaluateHeaderBackgroundImage,
  evaluateHeaderBackgroundGradient,
  evaluateHeaderBackgroundColor,
}: Pick<EvaluateResultHeaderSettings,
  | "evaluateHeaderBackgroundType"
  | "evaluateHeaderBackgroundImage"
  | "evaluateHeaderBackgroundGradient"
  | "evaluateHeaderBackgroundColor"
>): CSSProperties {
  if (evaluateHeaderBackgroundType === "image" && evaluateHeaderBackgroundImage) {
    return {
      backgroundImage: `url(${evaluateHeaderBackgroundImage})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    };
  }

  if (evaluateHeaderBackgroundType === "gradient") {
    return {
      background: evaluateHeaderBackgroundGradient || DEFAULT_EVALUATE_HEADER_GRADIENT,
    };
  }

  if (evaluateHeaderBackgroundType === "solid") {
    return {
      backgroundColor: `hsl(${evaluateHeaderBackgroundColor})`,
    };
  }

  return {
    background: DEFAULT_EVALUATE_HEADER_GRADIENT,
  };
}
