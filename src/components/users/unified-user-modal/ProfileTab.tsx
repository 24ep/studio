import {
  ProfileAdditionalInformation,
  ProfileColorField,
  ProfileFieldSeparator,
  ProfileInformationHeader,
  ProfileTextFieldRow,
} from './ProfileTabParts';
import type { ProfileTabProps } from './ProfileTabTypes';
import {
  PROFILE_BASIC_FIELDS,
  PROFILE_ORGANIZATION_FIELDS,
} from './profile-tab-config';

export function ProfileTab({
  form,
  mode,
  user,
  customFields,
  customFieldDefinitions,
  onCustomFieldChange,
}: ProfileTabProps) {
  const showAzureSyncedBadge = mode === 'edit' || mode === 'profile';

  return (
    <div className="space-y-4 mt-2 focus-visible:ring-0 focus-visible:outline-none">
      <div className="space-y-4">
        <ProfileInformationHeader showAzureSyncedBadge={showAzureSyncedBadge} />

        <div className="space-y-4 px-2">
          {PROFILE_ORGANIZATION_FIELDS.map((fieldConfig) => (
            <ProfileTextFieldRow
              key={fieldConfig.name}
              fieldConfig={fieldConfig}
              form={form}
            />
          ))}

          <ProfileFieldSeparator />

          {PROFILE_BASIC_FIELDS.map((fieldConfig) => (
            <ProfileTextFieldRow
              key={fieldConfig.name}
              fieldConfig={fieldConfig}
              form={form}
            />
          ))}

          <ProfileColorField form={form} />
        </div>
      </div>

      {customFieldDefinitions.length > 0 && (
        <ProfileAdditionalInformation
          customFields={customFields}
          onCustomFieldChange={onCustomFieldChange}
          userId={user?.id || 'new'}
        />
      )}
    </div>
  );
}
