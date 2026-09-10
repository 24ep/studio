export type BulkUploadCvUser = {
  id: string;
  role?: string | null;
  modulePermissions?: string[] | null;
};

export type AdditionalAttachmentPath = {
  path: string;
  name: string;
  size: number;
  type: string;
};

export type ParsedBulkUploadCvRequest = {
  file: File;
  additionalAttachments: File[];
  positionId: string;
  sourceId: string | null;
  subSource: string | null;
};

export type StoredBulkUploadCvFile = {
  uploadId: string;
  fileName: string;
  objectName: string;
  size: number;
};
