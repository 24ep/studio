import type { SystemSettingsRecord } from "./system-settings-utils";

export function stringSetting(settings: SystemSettingsRecord, key: string, fallback?: string): string;
export function stringSetting(settings: SystemSettingsRecord, key: string, fallback: null): string | null;
export function stringSetting(settings: SystemSettingsRecord, key: string, fallback: string | null = "") {
  const value = settings[key];
  return typeof value === "string" && value.trim() !== "" ? value : fallback;
}

export function numberSetting(settings: SystemSettingsRecord, key: string, fallback: string) {
  return parseInt(stringSetting(settings, key, fallback), 10);
}

export function isTrueSetting(settings: SystemSettingsRecord, key: string) {
  return settings[key] === "true";
}

export function isNotFalseSetting(settings: SystemSettingsRecord, key: string) {
  return settings[key] !== "false";
}

export function parseLockoutAlertEmails(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((email): email is string => typeof email === "string" && email.trim().length > 0);
  }

  if (typeof value !== "string" || value.trim() === "") {
    return [];
  }

  try {
    const emailList = JSON.parse(value) as unknown;
    return Array.isArray(emailList)
      ? emailList.filter((email): email is string => typeof email === "string" && email.trim().length > 0)
      : [];
  } catch {
    return value.split(",").map((email) => email.trim()).filter(Boolean);
  }
}
