import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import { ClientSecretCredential } from '@azure/identity';
import { isAzureADConfigured } from '@/lib/auth';
import type { V1AzureAdUser } from './sync-ad-v1-types';

export async function getV1GraphClient() {
  if (!isAzureADConfigured()) {
    throw new Error('Azure AD is not configured');
  }

  const tenantId = process.env.AZURE_AD_TENANT_ID!;
  const clientId = process.env.AZURE_AD_CLIENT_ID!;
  const clientSecret = process.env.AZURE_AD_CLIENT_SECRET!;

  const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
  const authProvider = new TokenCredentialAuthenticationProvider(credential, {
    scopes: ['https://graph.microsoft.com/.default'],
  });

  return Client.initWithMiddleware({ authProvider });
}

export async function fetchV1AzureAdUsers(graphClient: Client) {
  const users: V1AzureAdUser[] = [];
  let nextLink: string | undefined;

  do {
    const url = nextLink || '/users?$select=id,displayName,mail,userPrincipalName,accountEnabled,department,jobTitle';
    const response = await graphClient.api(url).get();

    if (response.value) {
      users.push(...response.value);
    }

    nextLink = response['@odata.nextLink'];
  } while (nextLink);

  return users;
}
