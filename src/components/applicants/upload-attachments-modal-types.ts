export interface FileWithTag {
  file: File;
  tag: string;
}

export interface UploadAttachmentsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  applicant: { id: string; name?: string | null } | null;
  onUploadSuccess: () => void;
}

export interface AttachmentTagOption {
  value: string;
  label: string;
}
