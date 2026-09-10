const LEGACY_DATA_CONFIGURATION_ROUTES: Record<string, string> = {
  "Applicant-sources": "/settings/applicant-sources",
  "company-references": "/settings/company-references",
  "leave-types": "/settings/leave-policies",
  "platform-defaults": "/settings/platform-defaults",
  "position-grades": "/settings/grades",
  "position-headcount": "/settings/headcount-types",
  "position-levels": "/settings/position-levels",
  "recruitment-stages": "/settings/stages",
};

export function getLegacyDataConfigurationRoute(section?: string) {
  return section ? LEGACY_DATA_CONFIGURATION_ROUTES[section] ?? "/settings" : "/settings";
}
