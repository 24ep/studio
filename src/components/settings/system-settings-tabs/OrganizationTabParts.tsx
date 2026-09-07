"use client";

import React, { type Dispatch, type SetStateAction } from 'react';
import { ImageUp, Plus, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDropdownOptions } from '@/hooks/use-dropdown-options';
import { defaultDropdownOptions } from '@/lib/dropdown-option-catalog';
import type { OrganizationProfile } from '@/lib/organization-profile';
import {
  CustomAttributeRow,
  ProfileInput,
  ProfileSelect,
} from './OrganizationProfileFieldParts';
import { SystemSettingsFieldRow } from './SystemSettingsFieldRow';

const MAX_ORGANIZATION_LOGO_SIZE_BYTES = 5 * 1024 * 1024;

export function OrganizationSettingsSection({
  children,
  description,
  title,
  value,
}: {
  children: React.ReactNode;
  description: string;
  title: string;
  value: string;
}) {
  return (
    <AccordionItem value={value} className="border-b">
      <AccordionTrigger className="px-6 py-4 hover:bg-muted/50">
        <div className="text-left">
          <div className="font-semibold">{title}</div>
          <div className="text-xs font-normal text-muted-foreground">{description}</div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-6 pb-4 pt-2">
        <div className="space-y-6">{children}</div>
      </AccordionContent>
    </AccordionItem>
  );
}

export function OrganizationLogoField({
  isSaving,
  organizationLogoPreviewUrl,
  setOrganizationLogoPreviewUrl,
  setSavedOrganizationLogoUrl,
}: {
  isSaving: boolean;
  organizationLogoPreviewUrl: string | null;
  setOrganizationLogoPreviewUrl: (val: string | null) => void;
  setSavedOrganizationLogoUrl: (val: string | null) => void;
}) {
  const handleOrganizationLogoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_ORGANIZATION_LOGO_SIZE_BYTES) {
      toast.error('Logo file size exceeds 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setOrganizationLogoPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <SystemSettingsFieldRow
      label="Organization Logo"
      description="Used on evaluation reports and generated documents. PNG or SVG, max 5MB."
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {organizationLogoPreviewUrl && (
          <div className="relative">
            <img
              src={organizationLogoPreviewUrl}
              alt="Organization logo preview"
              className="h-20 w-auto object-contain rounded-md border p-2"
            />
            <Button
              size="icon"
              variant="destructive"
              className="absolute -top-2 -right-2 h-6 w-6"
              onClick={() => {
                setOrganizationLogoPreviewUrl(null);
                setSavedOrganizationLogoUrl(null);
              }}
              disabled={isSaving}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <Input
            type="file"
            accept="image/*"
            onChange={handleOrganizationLogoChange}
            disabled={isSaving}
            className="hidden"
            id="organization-logo-upload"
          />
          <Label
            htmlFor="organization-logo-upload"
            className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
          >
            <ImageUp className="mr-2 h-4 w-4" />
            {organizationLogoPreviewUrl ? 'Replace Logo' : 'Upload Logo'}
          </Label>
        </div>
      </div>
    </SystemSettingsFieldRow>
  );
}

export function OrganizationInfoFields({
  isSaving,
  organizationAddress,
  organizationContact,
  organizationName,
  organizationProfile,
  setOrganizationAddress,
  setOrganizationContact,
  setOrganizationName,
  setOrganizationProfile,
}: {
  isSaving: boolean;
  organizationAddress: string;
  organizationContact: string;
  organizationName: string;
  organizationProfile: OrganizationProfile;
  setOrganizationAddress: (val: string) => void;
  setOrganizationContact: (val: string) => void;
  setOrganizationName: (val: string) => void;
  setOrganizationProfile: Dispatch<SetStateAction<OrganizationProfile>>;
}) {
  const organizationTypes = useDropdownOptions('organization_types', defaultDropdownOptions('organization_types'));
  const organizationSizes = useDropdownOptions('organization_sizes', defaultDropdownOptions('organization_sizes'));
  const updateProfile = <Key extends keyof OrganizationProfile>(
    key: Key,
    value: OrganizationProfile[Key],
  ) => {
    setOrganizationProfile(current => ({ ...current, [key]: value }));
  };

  return (
    <>
      <OrganizationSettingsSection
        value="identity"
        title="Identity"
        description="Legal, registration, and classification details."
      >
      <SystemSettingsFieldRow
        htmlFor="organization-name"
        label="Display Name"
        description="Short organization name shown across the application and reports."
      >
        <Input
          id="organization-name"
          value={organizationName}
          onChange={(event) => setOrganizationName(event.target.value)}
          placeholder="Enter organization name"
          disabled={isSaving}
        />
      </SystemSettingsFieldRow>

      <ProfileInput
        id="organization-legal-name"
        label="Legal Name"
        description="Registered legal entity name."
        value={organizationProfile.legalName}
        onChange={value => updateProfile('legalName', value)}
        disabled={isSaving}
      />
      <ProfileInput
        id="organization-trading-name"
        label="Trading Name"
        description="Brand or trading name, when different from the legal name."
        value={organizationProfile.tradingName}
        onChange={value => updateProfile('tradingName', value)}
        disabled={isSaving}
      />
      <ProfileInput
        id="organization-registration"
        label="Registration Number"
        description="Company or legal registration identifier."
        value={organizationProfile.registrationNumber}
        onChange={value => updateProfile('registrationNumber', value)}
        disabled={isSaving}
      />
      <ProfileInput
        id="organization-tax-id"
        label="Tax ID"
        description="Taxpayer, VAT, or national tax registration number."
        value={organizationProfile.taxId}
        onChange={value => updateProfile('taxId', value)}
        disabled={isSaving}
      />
      <ProfileSelect
        id="organization-type"
        label="Organization Type"
        description="Legal or operating structure."
        value={organizationProfile.organizationType}
        onChange={value => updateProfile('organizationType', value)}
        options={organizationTypes.map(option => option.value)}
        disabled={isSaving}
      />
      <ProfileInput
        id="organization-industry"
        label="Industry"
        description="Primary industry or business sector."
        value={organizationProfile.industry}
        onChange={value => updateProfile('industry', value)}
        disabled={isSaving}
      />
      <ProfileInput
        id="organization-founded-date"
        label="Founded Date"
        description="Date the organization was established."
        value={organizationProfile.foundedDate}
        onChange={value => updateProfile('foundedDate', value)}
        disabled={isSaving}
        type="date"
      />
      <ProfileSelect
        id="organization-employee-range"
        label="Employee Range"
        description="Approximate organization size."
        value={organizationProfile.employeeRange}
        onChange={value => updateProfile('employeeRange', value)}
        options={organizationSizes.map(option => option.value)}
        disabled={isSaving}
      />
      </OrganizationSettingsSection>

      <OrganizationSettingsSection
        value="contact"
        title="Contact"
        description="Public and administrative contact channels."
      >
      <ProfileInput
        id="organization-website"
        label="Website"
        description="Official organization website."
        value={organizationProfile.website}
        onChange={value => updateProfile('website', value)}
        disabled={isSaving}
        type="url"
        placeholder="https://example.com"
      />
      <ProfileInput
        id="organization-primary-email"
        label="Primary Email"
        description="Main organization contact email."
        value={organizationProfile.primaryEmail}
        onChange={value => updateProfile('primaryEmail', value)}
        disabled={isSaving}
        type="email"
      />
      <ProfileInput
        id="organization-phone"
        label="Phone"
        description="Main organization phone number."
        value={organizationProfile.phone}
        onChange={value => updateProfile('phone', value)}
        disabled={isSaving}
        type="tel"
      />
      <SystemSettingsFieldRow
        htmlFor="organization-contact"
        label="Contact Summary"
        description="Optional combined contact text for legacy reports and exported documents."
      >
        <Input
          id="organization-contact"
          value={organizationContact}
          onChange={(event) => setOrganizationContact(event.target.value)}
          placeholder="Email, phone, or support contact"
          disabled={isSaving}
        />
      </SystemSettingsFieldRow>
      </OrganizationSettingsSection>

      <OrganizationSettingsSection
        value="address"
        title="Registered Address"
        description="Structured address fields for documents, payroll, and compliance."
      >
      <ProfileInput
        id="organization-address-line-1"
        label="Address Line 1"
        description="Street address, building, or office."
        value={organizationProfile.addressLine1}
        onChange={value => updateProfile('addressLine1', value)}
        disabled={isSaving}
      />
      <ProfileInput
        id="organization-address-line-2"
        label="Address Line 2"
        description="Suite, floor, district, or additional address details."
        value={organizationProfile.addressLine2}
        onChange={value => updateProfile('addressLine2', value)}
        disabled={isSaving}
      />
      <ProfileInput
        id="organization-city"
        label="City"
        description="Registered city or locality."
        value={organizationProfile.city}
        onChange={value => updateProfile('city', value)}
        disabled={isSaving}
      />
      <ProfileInput
        id="organization-state"
        label="State / Province"
        description="State, province, region, or prefecture."
        value={organizationProfile.stateProvince}
        onChange={value => updateProfile('stateProvince', value)}
        disabled={isSaving}
      />
      <ProfileInput
        id="organization-postal-code"
        label="Postal Code"
        description="ZIP or postal code."
        value={organizationProfile.postalCode}
        onChange={value => updateProfile('postalCode', value)}
        disabled={isSaving}
      />
      <ProfileInput
        id="organization-country"
        label="Country"
        description="Country of registration."
        value={organizationProfile.country}
        onChange={value => updateProfile('country', value)}
        disabled={isSaving}
      />
      <SystemSettingsFieldRow
        htmlFor="organization-address"
        label="Address Summary"
        description="Optional combined address for legacy reports and exported documents."
      >
        <Input
          id="organization-address"
          value={organizationAddress}
          onChange={(event) => setOrganizationAddress(event.target.value)}
          placeholder="Full registered address"
          disabled={isSaving}
        />
      </SystemSettingsFieldRow>
      </OrganizationSettingsSection>

      <OrganizationSettingsSection
        value="regional"
        title="Regional Defaults"
        description="Localization and financial defaults used by HR workflows."
      >
      <ProfileInput
        id="organization-timezone"
        label="Time Zone"
        description="IANA time zone, such as Asia/Bangkok."
        value={organizationProfile.timezone}
        onChange={value => updateProfile('timezone', value)}
        disabled={isSaving}
        placeholder="Asia/Bangkok"
      />
      <ProfileInput
        id="organization-currency"
        label="Currency"
        description="ISO 4217 currency code."
        value={organizationProfile.currency}
        onChange={value => updateProfile('currency', value.toUpperCase().slice(0, 3))}
        disabled={isSaving}
        placeholder="THB"
      />
      <ProfileInput
        id="organization-language"
        label="Default Language"
        description="Default language or locale for organization content."
        value={organizationProfile.language}
        onChange={value => updateProfile('language', value)}
        disabled={isSaving}
        placeholder="en-TH"
      />
      <ProfileInput
        id="organization-fiscal-year"
        label="Fiscal Year Start"
        description="First day of the financial year."
        value={organizationProfile.fiscalYearStart}
        onChange={value => updateProfile('fiscalYearStart', value)}
        disabled={isSaving}
        type="date"
      />
      </OrganizationSettingsSection>

      <OrganizationSettingsSection
        value="custom"
        title="Custom Attributes"
        description="Add company-specific information with an appropriate data type."
      >
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => updateProfile('customAttributes', [
              ...organizationProfile.customAttributes,
              {
                id: globalThis.crypto?.randomUUID?.() || `attribute-${Date.now()}`,
                label: 'New attribute',
                type: 'text',
                value: '',
              },
            ])}
            disabled={isSaving}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add attribute
          </Button>
        </div>
      <div className="space-y-2">
        {organizationProfile.customAttributes.length === 0 ? (
          <p className="border border-dashed px-4 py-6 text-center text-xs text-muted-foreground">
            No custom company attributes.
          </p>
        ) : organizationProfile.customAttributes.map(attribute => (
          <CustomAttributeRow
            key={attribute.id}
            attribute={attribute}
            disabled={isSaving}
            onChange={next => updateProfile(
              'customAttributes',
              organizationProfile.customAttributes.map(current => current.id === next.id ? next : current),
            )}
            onRemove={() => updateProfile(
              'customAttributes',
              organizationProfile.customAttributes.filter(current => current.id !== attribute.id),
            )}
          />
        ))}
      </div>
      </OrganizationSettingsSection>
    </>
  );
}
