export interface FileViewerFile {
  fileName: string;
  url: string;
  label?: string;
  updatedAt?: string;
  fileSize?: number | string;
  filePath?: string;
  applicantId?: string;
  headcountId?: string;
}

export interface FileViewerModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  file: FileViewerFile | null;
}
