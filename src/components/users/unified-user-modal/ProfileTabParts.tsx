import {
  BadgeInfo,
  Briefcase,
  Building,
  Building2,
  Calendar,
  Mail,
  MapPin,
  Phone,
} from 'lucide-react';
import type { ComponentType } from 'react';

import { CustomFieldEdit } from '@/components/applicants/CustomFieldEdit';
import { PersonalColorPicker } from '@/components/settings/PersonalColorPicker';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

import type { ProfileTabProps } from './ProfileTabTypes';
import {
  getProfileTextFieldValue,
  type ProfileFieldIcon,
  type ProfileTextFieldConfig,
} from './profile-tab-config';

const FIELD_ICON_MAP = {
  building: Building,
  briefcase: Briefcase,
  mapPin: MapPin,
  mail: Mail,
  phone: Phone,
} satisfies Record<ProfileFieldIcon, ComponentType<{ className?: string }>>;

const PROFILE_INPUT_CLASS = 'bg-muted/30 border-none shadow-none focus-visible:ring-1 focus-visible:ring-primary/20';
const PROFILE_FORM_ROW_CLASS = 'grid grid-cols-1 md:grid-cols-[200px,1fr] items-center gap-2 md:gap-8 space-y-0';

export function ProfileInformationHeader({
  showAzureSyncedBadge,
}: {
  showAzureSyncedBadge: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b pb-2">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <BadgeInfo className="h-5 w-5 text-primary" />
        Profile Information
      </h3>
      {showAzureSyncedBadge && (
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-bold text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
          <Building2 className="h-3 w-3" />
          <span>Synced from Azure AD</span>
        </div>
      )}
    </div>
  );
}

export function ProfileTextFieldRow({
  fieldConfig,
  form,
}: {
  fieldConfig: ProfileTextFieldConfig;
  form: ProfileTabProps['form'];
}) {
  const Icon = FIELD_ICON_MAP[fieldConfig.icon];

  return (
    <FormField
      control={form.control}
      name={fieldConfig.name}
      render={({ field }) => (
        <FormItem className={PROFILE_FORM_ROW_CLASS}>
          <FormLabel className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <Icon className="h-4 w-4" /> {fieldConfig.label}
          </FormLabel>
          <div className="space-y-1">
            <FormControl>
              <Input
                {...field}
                value={getProfileTextFieldValue(field.value)}
                placeholder={fieldConfig.placeholder}
                className={PROFILE_INPUT_CLASS}
              />
            </FormControl>
            <FormMessage />
          </div>
        </FormItem>
      )}
    />
  );
}

export function ProfileColorField({ form }: { form: ProfileTabProps['form'] }) {
  return (
    <FormField
      control={form.control}
      name="personalColor"
      render={({ field }) => (
        <FormItem className={PROFILE_FORM_ROW_CLASS}>
          <FormLabel className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border border-border" style={{ backgroundColor: field.value || '#3B82F6' }} /> Theme Color
          </FormLabel>
          <FormControl>
            <PersonalColorPicker
              personalColor={field.value || '#3B82F6'}
              onColorChange={field.onChange}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function ProfileFieldSeparator() {
  return <Separator className="opacity-50" />;
}

export function ProfileAdditionalInformation({
  customFields,
  onCustomFieldChange,
  userId,
}: {
  customFields: ProfileTabProps['customFields'];
  onCustomFieldChange: ProfileTabProps['onCustomFieldChange'];
  userId: string;
}) {
  return (
    <div className="space-y-4 pt-4 border-t">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Calendar className="h-5 w-5 text-primary" />
        Additional Information
      </h3>
      <div className="px-2">
        <CustomFieldEdit
          modelName="User"
          entityId={userId}
          section="personal"
          customFields={customFields}
          onFieldChange={onCustomFieldChange}
        />
      </div>
    </div>
  );
}
