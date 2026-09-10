export type OrganizationAttributeType =
  | 'text'
  | 'number'
  | 'date'
  | 'email'
  | 'phone'
  | 'url'
  | 'boolean';

export interface OrganizationCustomAttribute {
  id: string;
  label: string;
  type: OrganizationAttributeType;
  value: string;
}

export interface OrganizationProfile {
  legalName: string;
  tradingName: string;
  registrationNumber: string;
  taxId: string;
  organizationType: string;
  industry: string;
  foundedDate: string;
  employeeRange: string;
  website: string;
  primaryEmail: string;
  employeeEmailDomain: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  stateProvince: string;
  postalCode: string;
  country: string;
  timezone: string;
  currency: string;
  language: string;
  fiscalYearStart: string;
  customAttributes: OrganizationCustomAttribute[];
}

export const DEFAULT_ORGANIZATION_PROFILE: OrganizationProfile = {
  legalName: '',
  tradingName: '',
  registrationNumber: '',
  taxId: '',
  organizationType: '',
  industry: '',
  foundedDate: '',
  employeeRange: '',
  website: '',
  primaryEmail: '',
  employeeEmailDomain: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  stateProvince: '',
  postalCode: '',
  country: '',
  timezone: '',
  currency: '',
  language: '',
  fiscalYearStart: '',
  customAttributes: [],
};

export function parseOrganizationProfile(value: unknown): OrganizationProfile {
  if (typeof value !== 'string' || !value.trim()) return DEFAULT_ORGANIZATION_PROFILE;
  try {
    const parsed = JSON.parse(value) as Partial<OrganizationProfile>;
    return {
      ...DEFAULT_ORGANIZATION_PROFILE,
      ...parsed,
      customAttributes: Array.isArray(parsed.customAttributes)
        ? parsed.customAttributes.filter(isCustomAttribute)
        : [],
    };
  } catch {
    return DEFAULT_ORGANIZATION_PROFILE;
  }
}

function isCustomAttribute(value: unknown): value is OrganizationCustomAttribute {
  if (!value || typeof value !== 'object') return false;
  const attribute = value as Partial<OrganizationCustomAttribute>;
  return typeof attribute.id === 'string'
    && typeof attribute.label === 'string'
    && typeof attribute.value === 'string'
    && ['text', 'number', 'date', 'email', 'phone', 'url', 'boolean'].includes(attribute.type || '');
}
