export interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

export function validateDragDropUploadFile(file: File, maxFileSize: number) {
  if (maxFileSize && file.size > maxFileSize) {
    return `File size exceeds ${Math.round(maxFileSize / 1024 / 1024)}MB limit`;
  }
  return null;
}

export function createUploadFileEntries(files: File[], createId = createUploadFileId): UploadFile[] {
  return files.map((file) => ({
    id: createId(),
    file,
    progress: 0,
    status: 'pending',
  }));
}

export function updateUploadFileProgress(uploadFiles: UploadFile[], fileId: string, progress: number) {
  return uploadFiles.map((uploadFile) =>
    uploadFile.id === fileId
      ? { ...uploadFile, progress, status: progress === 100 ? 'completed' as const : 'uploading' as const }
      : uploadFile
  );
}

export function markMatchingUploadFilesStatus(
  uploadFiles: UploadFile[],
  files: File[],
  status: UploadFile['status'],
  error?: string,
) {
  const fileNames = new Set(files.map((file) => file.name));

  return uploadFiles.map((uploadFile) =>
    fileNames.has(uploadFile.file.name)
      ? { ...uploadFile, status, ...(error ? { error } : {}) }
      : uploadFile
  );
}

export function removeCompletedUploadFiles(uploadFiles: UploadFile[]) {
  return uploadFiles.filter((uploadFile) => uploadFile.status !== 'completed');
}

export function getUploadingFilesCount(uploadFiles: UploadFile[]) {
  return uploadFiles.filter((uploadFile) => uploadFile.status === 'uploading').length;
}

export function getUploadStatusBadgeVariant(status: UploadFile['status']) {
  switch (status) {
    case 'uploading':
    case 'completed':
      return 'default' as const;
    case 'error':
      return 'destructive' as const;
    case 'pending':
    default:
      return 'secondary' as const;
  }
}

function createUploadFileId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;
}
