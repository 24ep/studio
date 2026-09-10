import { getSystemSetting } from '../systemSettings';
import { getJsonNumber, getJsonString, readJsonObject } from '../response-json';

interface GraphAccessToken {
  access_token: string;
  expires_in: number;
  token_type: string;
  expires_at: number;
}

interface AzureCredentials {
  clientId: string;
  clientSecret: string;
  tenantId: string;
}

let cachedToken: GraphAccessToken | null = null;
let cachedCredentials: AzureCredentials | null = null;
let credentialsCacheTime = 0;

const CREDENTIALS_CACHE_TTL = 60000;
const TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000;
const AZURE_CREDENTIAL_PLACEHOLDERS = [
  'your_azure_ad_application_client_id',
  'your_azure_ad_client_secret_value',
  'your_azure_ad_directory_tenant_id',
];

function isValidCredential(value: string | null | undefined): value is string {
  return Boolean(value) && !AZURE_CREDENTIAL_PLACEHOLDERS.includes(value as string);
}

async function getDatabaseAzureCredentials(): Promise<AzureCredentials | null> {
  const [clientId, clientSecret, tenantId] = await Promise.all([
    getSystemSetting('azureAdClientId'),
    getSystemSetting('azureAdClientSecret'),
    getSystemSetting('azureAdTenantId'),
  ]);

  return isValidCredential(clientId) && isValidCredential(clientSecret) && isValidCredential(tenantId)
    ? { clientId, clientSecret, tenantId }
    : null;
}

function getEnvironmentAzureCredentials(): AzureCredentials | null {
  const clientId = process.env.AZURE_AD_CLIENT_ID;
  const clientSecret = process.env.AZURE_AD_CLIENT_SECRET;
  const tenantId = process.env.AZURE_AD_TENANT_ID;

  return isValidCredential(clientId) && isValidCredential(clientSecret) && isValidCredential(tenantId)
    ? { clientId, clientSecret, tenantId }
    : null;
}

export async function getAzureCredentials(): Promise<AzureCredentials | null> {
  const now = Date.now();
  if (cachedCredentials && (now - credentialsCacheTime) < CREDENTIALS_CACHE_TTL) {
    return cachedCredentials;
  }

  try {
    cachedCredentials = await getDatabaseAzureCredentials();
  } catch (error) {
    console.warn('[GraphClient] Failed to fetch credentials from database, falling back to env vars:', error);
  }

  cachedCredentials = cachedCredentials ?? getEnvironmentAzureCredentials();
  credentialsCacheTime = cachedCredentials ? now : 0;

  return cachedCredentials;
}

export function isGraphConfigured(): boolean {
  return getEnvironmentAzureCredentials() !== null;
}

export async function isGraphConfiguredAsync(): Promise<boolean> {
  return (await getAzureCredentials()) !== null;
}

export async function getGraphAccessToken(): Promise<string | null> {
  const credentials = await getAzureCredentials();

  if (!credentials) {
    console.warn('[GraphClient] Azure AD is not properly configured');
    return null;
  }

  const now = Date.now();
  if (cachedToken && cachedToken.expires_at > now + TOKEN_EXPIRY_BUFFER_MS) {
    return cachedToken.access_token;
  }

  try {
    const params = new URLSearchParams({
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials',
    });

    const response = await fetch(
      `https://login.microsoftonline.com/${credentials.tenantId}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[GraphClient] Token request failed:', response.status, errorText);
      return null;
    }

    const tokenData = await readJsonObject(response);
    const accessToken = getJsonString(tokenData, 'access_token');
    const expiresIn = getJsonNumber(tokenData, 'expires_in');
    const tokenType = getJsonString(tokenData, 'token_type') ?? 'Bearer';
    if (!accessToken || !expiresIn) {
      console.error('[GraphClient] Token response missing access token or expiry');
      return null;
    }

    cachedToken = {
      access_token: accessToken,
      expires_in: expiresIn,
      token_type: tokenType,
      expires_at: now + (expiresIn * 1000),
    };

    return cachedToken.access_token;
  } catch (error) {
    console.error('[GraphClient] Error getting access token:', error);
    return null;
  }
}

export async function getGraphClient(): Promise<import('@microsoft/microsoft-graph-client').Client> {
  const credentials = await getAzureCredentials();

  if (!credentials) {
    throw new Error('Azure AD is not configured. Please configure credentials in System Settings or environment variables.');
  }

  const { Client } = await import('@microsoft/microsoft-graph-client');
  const { TokenCredentialAuthenticationProvider } = await import('@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials');
  const { ClientSecretCredential } = await import('@azure/identity');

  const credential = new ClientSecretCredential(
    credentials.tenantId,
    credentials.clientId,
    credentials.clientSecret
  );
  const authProvider = new TokenCredentialAuthenticationProvider(credential, {
    scopes: ['https://graph.microsoft.com/.default'],
  });

  return Client.initWithMiddleware({ authProvider });
}
