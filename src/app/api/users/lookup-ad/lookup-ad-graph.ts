import type { getGraphClient } from "@/lib/graphClient";

const SELECT_FIELDS = "id,displayName,mail,userPrincipalName,jobTitle,department,officeLocation,mobilePhone,businessPhones,officeLocation,accountEnabled";

type GraphClient = Awaited<ReturnType<typeof getGraphClient>>;

export type GraphUser = {
  id: string;
  displayName?: string | null;
  mail?: string | null;
  userPrincipalName?: string | null;
  jobTitle?: string | null;
  department?: string | null;
  officeLocation?: string | null;
  mobilePhone?: string | null;
  businessPhones?: string[] | null;
  accountEnabled?: boolean | null;
};

type GraphCollectionResponse<T> = {
  value?: T[];
};

type GraphError = Error & {
  statusCode?: number;
};

export type LookupAdErrorLogger = (message: string, error: unknown) => void;

export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function getGraphStatusCode(error: unknown) {
  return error instanceof Error ? (error as GraphError).statusCode : undefined;
}

export function escapeODataString(value: string) {
  return value.replace(/'/g, "''");
}

function isGraphUser(value: unknown): value is GraphUser {
  return Boolean(value) && typeof value === "object" && typeof (value as Partial<GraphUser>).id === "string";
}

async function lookupGraphUserByPath(graphClient: GraphClient, email: string) {
  const response = await graphClient
    .api(`/users/${encodeURIComponent(email)}`)
    .select(SELECT_FIELDS)
    .get();

  return isGraphUser(response) ? response : null;
}

async function queryGraphUsers(graphClient: GraphClient, filter: string): Promise<GraphUser[]> {
  const response = await graphClient
    .api(`/users?$filter=${filter}&$select=${SELECT_FIELDS}`)
    .get() as GraphCollectionResponse<unknown>;

  return Array.isArray(response.value) ? response.value.filter(isGraphUser) : [];
}

export function findExactEmailMatch(users: GraphUser[], emailLower: string) {
  return users.find(user =>
    user.mail?.toLowerCase() === emailLower ||
    user.userPrincipalName?.toLowerCase() === emailLower,
  ) || users[0] || null;
}

export async function lookupGraphUserByEmail(
  graphClient: GraphClient,
  email: string,
  logLookupError: LookupAdErrorLogger,
) {
  const escapedEmail = escapeODataString(email);

  try {
    const directUser = await lookupGraphUserByPath(graphClient, email);
    if (directUser) {
      return directUser;
    }
  } catch (error: unknown) {
    if (getGraphStatusCode(error) !== 404) {
      logLookupError("[AD LOOKUP] Error with direct access:", error);
    }
  }

  try {
    const users = await queryGraphUsers(graphClient, `mail eq '${escapedEmail}'`);
    if (users.length > 0) {
      return users[0];
    }
  } catch (error: unknown) {
    logLookupError("[AD LOOKUP] Error searching by mail:", error);
  }

  try {
    const users = await queryGraphUsers(graphClient, `userPrincipalName eq '${escapedEmail}'`);
    if (users.length > 0) {
      return users[0];
    }
  } catch (error: unknown) {
    logLookupError("[AD LOOKUP] Error searching by userPrincipalName:", error);
  }

  try {
    const emailLower = email.toLowerCase();
    const escapedEmailLower = escapeODataString(emailLower);
    const users = await queryGraphUsers(
      graphClient,
      `startswith(toLower(mail),'${escapedEmailLower}') or startswith(toLower(userPrincipalName),'${escapedEmailLower}')`,
    );

    return findExactEmailMatch(users, emailLower);
  } catch (error: unknown) {
    logLookupError("[AD LOOKUP] Error with startsWith search:", error);
    return null;
  }
}

export function mapGraphUserToLookupResponse(adUser: GraphUser) {
  return {
    id: adUser.id,
    displayName: adUser.displayName,
    email: adUser.mail || adUser.userPrincipalName,
    userPrincipalName: adUser.userPrincipalName,
    jobTitle: adUser.jobTitle || null,
    department: adUser.department || null,
    officeLocation: adUser.officeLocation || null,
    mobilePhone: adUser.mobilePhone || null,
    businessPhones: adUser.businessPhones || [],
    accountEnabled: adUser.accountEnabled,
  };
}
