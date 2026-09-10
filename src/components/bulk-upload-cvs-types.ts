export interface BulkUploadResultSummary {
  success: boolean;
  data: unknown;
  successful: number;
  failed: number;
  errors: string[];
  queuedAfterTimeout?: boolean;
}

export interface BulkUploadToastMessage {
  title: string;
  description?: string;
}

export interface BulkUploadModalFormState {
  selectedFiles: File[];
  selectedPositionId: string;
  selectedPositionIds: Set<string>;
  selectedSourceId: string;
  subSource: string;
  selectedFileIndex: number;
  uploadProgress: { current: number; total: number } | null;
  uploading: boolean;
}

export interface BulkUploadViewerFile {
  fileName: string;
  url: string;
  label?: string;
  updatedAt?: string;
  fileSize?: number;
}

export interface BulkUploadLayoutClasses {
  gridClassName: string;
  uploadAreaClassName: string;
}
