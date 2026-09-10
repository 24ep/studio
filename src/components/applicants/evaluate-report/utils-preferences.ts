import { permissionMatches } from '../../../lib/permission-aliases';
import { getSystemSettingString, normalizeSystemSettingsResponse } from '../../../lib/system-settings-response';

export interface ReportHeaderPreferences {
    appLogoUrl: string | null;
    organizationLogoUrl: string | null;
    organizationName: string | null;
    organizationAddress: string | null;
    organizationContact: string | null;
}

interface ReportPermissionUser {
    role?: string | null;
    modulePermissions?: string[] | null;
}

export function normalizeReportHeaderPreferences(settingsData: unknown): ReportHeaderPreferences {
    const prefs = normalizeSystemSettingsResponse(settingsData);
    const appLogoUrl = getSystemSettingString(prefs, 'evaluateReportLogoDataUrl') ||
        getSystemSettingString(prefs, 'evaluatePlatformLogoDataUrl') ||
        getSystemSettingString(prefs, 'appLogoDataUrl') ||
        null;
    const organizationLogoUrl = getSystemSettingString(prefs, 'organizationLogoDataUrl') ||
        getSystemSettingString(prefs, 'evaluateReportLogoDataUrl') ||
        getSystemSettingString(prefs, 'evaluatePlatformLogoDataUrl') ||
        getSystemSettingString(prefs, 'appLogoDataUrl') ||
        null;

    return {
        appLogoUrl,
        organizationLogoUrl,
        organizationName: getSystemSettingString(prefs, 'organizationName') || null,
        organizationAddress: getSystemSettingString(prefs, 'organizationAddress') || null,
        organizationContact: getSystemSettingString(prefs, 'organizationContact') || null,
    };
}

export function canEditEvaluateReportApplicantBasic(user?: ReportPermissionUser | null) {
    if (!user) return false;
    if (user.role === 'Admin') return true;

    const modulePermissions = Array.isArray(user.modulePermissions)
        ? user.modulePermissions
        : [];

    return permissionMatches(modulePermissions, 'APPLICANTS_EDIT_BASIC') ||
        permissionMatches(modulePermissions, 'APPLICANTS_EDIT_BASIC_OWN') ||
        permissionMatches(modulePermissions, 'APPLICANTS_EDIT_BASIC_ALL');
}
