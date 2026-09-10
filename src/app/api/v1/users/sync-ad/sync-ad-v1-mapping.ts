import type { V1AzureAdUser, V1AzureAdUserSyncData } from './sync-ad-v1-types';

export function buildV1AzureAdUserDataMap(adUsers: V1AzureAdUser[]) {
  const userDataMap = new Map<string, V1AzureAdUserSyncData>();
  const enabledUsers = adUsers.filter(user => user.accountEnabled !== false);

  for (const adUser of enabledUsers) {
    const email = adUser.mail || adUser.userPrincipalName;
    if (!email || !adUser.id) {
      continue;
    }

    userDataMap.set(email, {
      email,
      name: adUser.displayName || email.split('@')[0],
      azureOid: adUser.id,
      department: adUser.department || null,
      jobTitle: adUser.jobTitle || null,
    });
  }

  return userDataMap;
}
