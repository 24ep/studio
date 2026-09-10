import type { AzureAdSyncStreamContext, AzureAdUserSyncData } from './azure-ad-sync-types';

export type AzureAdSyncSession = AzureAdSyncStreamContext['session'];

export type UserTeamRow = {
  id: string;
  name: string;
};

export type ExistingAzureAdUserRow = {
  id: string;
  email: string;
  azure_oid?: string | null;
  userGroupId?: string | null;
  avatarUrl?: string | null;
};

export type AzureAdUserUpdateData = AzureAdUserSyncData & {
  id: string;
  userTeamId?: string | null;
  avatarUrl?: string | null;
};

export type DeletedAzureAdUserRow = {
  id: string;
  email: string;
  azure_oid: string;
  deleted_from_ad: boolean;
};

export type UserIdRow = {
  id: string;
};
