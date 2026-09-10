import { v4 as uuidv4 } from 'uuid';

import { getAzureAdProfileAttributes } from '@/lib/auth-config-utils';
import {
  PRE_REGISTERED_GROUP_ID,
  type UsableAzureAdAccount,
  type UsableAzureAdProfile,
} from './auth-azure-ad-signin-types';

export function createAzureAdUserId() {
  return uuidv4();
}

export function buildAzureAdUserInsertValues({
  oid,
  picture,
  placeholderPassword,
  profile,
  userId,
}: {
  oid: string;
  picture: string | null;
  placeholderPassword: string;
  profile: UsableAzureAdProfile;
  userId: string;
}) {
  const azureAttributes = getAzureAdProfileAttributes(profile);

  return [
    userId,
    profile.name || profile.email,
    profile.email,
    new Date(),
    picture,
    'Recruiter',
    placeholderPassword,
    ['azure_ad'],
    oid,
    PRE_REGISTERED_GROUP_ID,
    azureAttributes.jobTitle,
    azureAttributes.department,
    azureAttributes.mobilePhone,
    azureAttributes.officeLocation,
  ];
}

export function buildAzureAdAccountInsertValues(
  account: UsableAzureAdAccount,
  userId: string,
) {
  return [
    uuidv4(),
    userId,
    account.type,
    account.provider,
    account.providerAccountId,
    account.access_token,
    account.expires_at,
    account.scope,
    account.token_type,
    account.id_token,
  ];
}

export function buildAzureAdAccountUpdateValues(
  account: UsableAzureAdAccount,
  userId: string,
  accountId: string,
) {
  return [
    userId,
    account.access_token,
    account.expires_at,
    account.scope,
    account.token_type,
    account.id_token,
    accountId,
  ];
}
