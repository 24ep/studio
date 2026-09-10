import type {
  buildApplicantDetailResponseData,
  ApplicantDetailApplicantRow,
  ApplicantDetailAttachmentRow,
  ApplicantDetailJobMatchRow,
} from './applicant-detail-response-utils';
import type { CompanyReference } from '@/lib/types';

export interface ApplicantDetailQueryClient {
  query: (query: string, values?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>;
}

export interface ApplicantDetailAuthClient extends ApplicantDetailQueryClient {
  release: () => void;
}

export interface ApplicantDetailAuthInput {
  applicantId: string;
  userId?: string | null;
  token?: string | null;
  connectClient: () => Promise<ApplicantDetailAuthClient>;
}

export interface ApplicantJobMatchFeatureInput {
  readSystemSetting: (key: string) => Promise<unknown>;
  onError?: (error: unknown) => void;
}

export interface ApplicantHeadStatusInput {
  client: ApplicantDetailQueryClient;
  applicantId: string;
  now?: () => number;
}

export interface ApplicantDetailFetchInput {
  client: ApplicantDetailQueryClient;
  applicantId: string;
  userId?: string | null;
  lite: boolean;
  readSystemSetting: (key: string) => Promise<unknown>;
}

export type ApplicantDetailFetchResult =
  | { found: false }
  | { found: true; responseData: ReturnType<typeof buildApplicantDetailResponseData> };

export interface ApplicantPostUpdateResponsePartsInput {
  client: ApplicantDetailQueryClient;
  applicantId: string;
  actingUserId: string;
  isJobMatchEnabled: boolean;
  newReadStatus?: boolean;
}

export interface ApplicantPostUpdateResponseParts {
  applicant: ApplicantDetailApplicantRow;
  customAttributes: Record<string, unknown>;
  jobMatches: ApplicantDetailJobMatchRow[];
  attachments: ApplicantDetailAttachmentRow[];
  userReadStatus: boolean | null;
  companyReferences?: CompanyReference[];
}
