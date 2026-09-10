import type {
  UnifiedUserAzureAdUser,
  UnifiedUserCustomFields,
  UnifiedUserFormValues,
} from './types';

type AzureAdUserField = keyof UnifiedUserAzureAdUser;

const AZURE_AD_CUSTOM_FIELD_MAPPINGS: Array<[
  AzureAdUserField,
  string[],
]> = [
  ['jobTitle', ['POSITION', 'JOB_TITLE']],
  ['department', ['DEPARTMENT']],
  ['officeLocation', ['OFFICE_LOCATION']],
  ['mobilePhone', ['MOBILE_PHONE']],
];

function getStringValue(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : null;
}

function mergeAzureAdCustomFields(
  currentCustomFields: UnifiedUserCustomFields,
  adUser: UnifiedUserAzureAdUser
) {
  const customFields = { ...currentCustomFields };

  for (const [source, targets] of AZURE_AD_CUSTOM_FIELD_MAPPINGS) {
    const value = getStringValue(adUser[source]);
    if (value) {
      targets.forEach((target) => {
        customFields[target] = value;
      });
    }
  }

  return customFields;
}

export function getUnifiedUserAzureAdSuccessMessage(adUser: UnifiedUserAzureAdUser) {
  const jobTitle = getStringValue(adUser.jobTitle);
  return `User data loaded from Azure AD${jobTitle ? ` - ${jobTitle}` : ''}`;
}

export function mergeUnifiedUserAzureAdFields({
  currentCustomFields,
  adUser,
}: {
  currentCustomFields: UnifiedUserCustomFields;
  adUser: UnifiedUserAzureAdUser;
}) {
  const formUpdates: Partial<UnifiedUserFormValues> = {};
  const displayName = getStringValue(adUser.displayName);
  const jobTitle = getStringValue(adUser.jobTitle);

  if (displayName) {
    formUpdates.name = displayName;
  }

  if (jobTitle) {
    formUpdates.positionTitle = jobTitle;
  }

  return {
    formUpdates,
    customFields: mergeAzureAdCustomFields(currentCustomFields, adUser),
  };
}
