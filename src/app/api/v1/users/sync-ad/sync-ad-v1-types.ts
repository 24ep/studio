export type V1AzureAdUser = {
  id?: string;
  displayName?: string;
  mail?: string;
  userPrincipalName?: string;
  accountEnabled?: boolean;
  department?: string | null;
  jobTitle?: string | null;
};

export type V1AzureAdUserSyncData = {
  email: string;
  name: string;
  azureOid: string;
  department: string | null;
  jobTitle: string | null;
};

export type V1AzureAdSyncResults = {
  created: number;
  updated: number;
  skipped: number;
  errors: Array<{ email: string; error: string }>;
};
