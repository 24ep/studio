import type {
  AzureAdAccount,
  AzureAdProfile,
  UsableAzureAdAccount,
  UsableAzureAdProfile,
} from './auth-azure-ad-signin-types';

export function isUsableAzureAdAccount(account: AzureAdAccount | null | undefined): account is UsableAzureAdAccount {
  return account?.provider === 'azure-ad' && typeof account.providerAccountId === 'string';
}

export function isUsableAzureAdProfile(profile: AzureAdProfile | null | undefined): profile is UsableAzureAdProfile {
  return typeof profile?.email === 'string' && profile.email.trim() !== '';
}

export function getAzureAdAllowedMethods(methods: unknown) {
  return Array.isArray(methods)
    ? methods.filter((method): method is string => typeof method === 'string')
    : ['basic'];
}

export function getAzureAdProfileObjectId(profile: UsableAzureAdProfile) {
  return profile.oid ?? profile.sub ?? profile.email;
}
