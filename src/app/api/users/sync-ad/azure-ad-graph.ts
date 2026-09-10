import { ResponseType } from '@microsoft/microsoft-graph-client';
import { randomUUID } from 'crypto';
import { ensureBucketExists, minioClient, MINIO_BUCKET } from '@/lib/minio';

const AZURE_AD_USER_SELECT_FIELDS = [
  'id', 'displayName', 'mail', 'userPrincipalName', 'accountEnabled',
  'department', 'jobTitle', 'officeLocation',
  'employeeId', 'companyName', 'employeeType', 'employeeHireDate',
  'onPremisesSamAccountName',
  'streetAddress', 'city', 'state', 'postalCode', 'country',
  'businessPhones', 'mobilePhone', 'otherMails',
].join(',');

type GraphRequestLike = {
  get: () => Promise<unknown>;
  responseType: (responseType: ResponseType) => GraphRequestLike;
};

export type GraphClientLike = {
  api: (path: string) => GraphRequestLike;
};

type AzureAdUsersResponse = {
  value?: AzureAdGraphUser[];
  '@odata.nextLink'?: string;
};

export type AzureAdGraphUser = {
  id?: string;
  displayName?: string | null;
  mail?: string | null;
  userPrincipalName?: string | null;
  accountEnabled?: boolean | null;
  department?: string | null;
  jobTitle?: string | null;
  officeLocation?: string | null;
  employeeId?: string | null;
  companyName?: string | null;
  employeeType?: string | null;
  employeeHireDate?: string | null;
  onPremisesSamAccountName?: string | null;
  streetAddress?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  businessPhones?: string[] | null;
  mobilePhone?: string | null;
  otherMails?: string[] | null;
  manager?: {
    displayName?: string | null;
    mail?: string | null;
  } | null;
};

function isAzureAdUsersResponse(value: unknown): value is AzureAdUsersResponse {
  return Boolean(value) && typeof value === 'object';
}

function toPhotoBuffer(value: unknown): Buffer {
  if (Buffer.isBuffer(value)) {
    return value;
  }

  if (value instanceof ArrayBuffer) {
    return Buffer.from(value);
  }

  if (ArrayBuffer.isView(value)) {
    return Buffer.from(value.buffer, value.byteOffset, value.byteLength);
  }

  return Buffer.alloc(0);
}

export async function fetchAzureADUsers(graphClient: GraphClientLike): Promise<AzureAdGraphUser[]> {
  const users: AzureAdGraphUser[] = [];
  let nextLink: string | undefined;

  do {
    const url = nextLink || `/users?$select=${AZURE_AD_USER_SELECT_FIELDS}&$expand=manager($select=displayName,mail)`;
    const response = await graphClient.api(url).get();

    if (!isAzureAdUsersResponse(response)) {
      break;
    }

    if (response.value) {
      users.push(...response.value);
    }

    nextLink = response['@odata.nextLink'];
  } while (nextLink);

  return users;
}

export async function fetchAndUploadAvatar(graphClient: GraphClientLike, azureOid: string): Promise<string | null> {
  try {
    const photo = await fetchAzureAdPhoto(graphClient, azureOid);
    if (!photo) {
      return null;
    }

    await ensureBucketExists();
    const objectName = `profile-images/${Date.now()}-${randomUUID()}.jpg`;

    await minioClient.putObject(MINIO_BUCKET, objectName, photo, photo.length, {
      'Content-Type': 'image/jpeg',
      'x-amz-meta-uploaded-by': 'system-sync',
      'x-amz-meta-original-source': 'azure-ad',
    });

    return `/api/secure-file/preview?filePath=${encodeURIComponent(objectName)}`;
  } catch (error) {
    console.error(`Error syncing avatar for ${azureOid}:`, error);
    return null;
  }
}

async function fetchAzureAdPhoto(graphClient: GraphClientLike, azureOid: string): Promise<Buffer | null> {
  try {
    const photoStream = await graphClient.api(`/users/${azureOid}/photo/$value`)
      .responseType(ResponseType.ARRAYBUFFER)
      .get();
    const buffer = toPhotoBuffer(photoStream);
    return buffer.length === 0 ? null : buffer;
  } catch {
    return null;
  }
}
