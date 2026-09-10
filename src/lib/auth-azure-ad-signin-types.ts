export const PRE_REGISTERED_GROUP_ID = '00000000-0000-0000-0000-000000000004';

export type AzureAdMutableUser = {
  id?: string;
};

export interface AzureAdAccount extends Record<string, unknown> {
  provider?: string;
  providerAccountId?: string;
  type?: string;
  access_token?: unknown;
  expires_at?: unknown;
  scope?: unknown;
  token_type?: unknown;
  id_token?: unknown;
}

export interface UsableAzureAdAccount extends AzureAdAccount {
  provider: 'azure-ad';
  providerAccountId: string;
}

export interface AzureAdProfile extends Record<string, unknown> {
  email?: string | null;
  name?: string | null;
  oid?: string | null;
  sub?: string | null;
  picture?: string | null;
}

export interface UsableAzureAdProfile extends AzureAdProfile {
  email: string;
}

export interface AzureAdDbUser extends Record<string, unknown> {
  id: string;
  is_active?: boolean;
  userGroupId?: string | null;
  authentication_methods?: unknown;
}

export interface AzureAdAccountRow {
  id: string;
  userId?: string | null;
}

export type AzureAdSignInContext = {
  user: AzureAdMutableUser | null | undefined;
  account: AzureAdAccount | null | undefined;
  profile: AzureAdProfile | null | undefined;
  isAzureAdConfigured: boolean;
};
