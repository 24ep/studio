export interface Attachment {
  id: string;
  fileName: string;
  filePath: string;
  uploadedAt: string;
  uploadedBy?: {
    id: string;
    name: string | null;
    email: string | null;
  };
  url?: string;
  label?: string;
  isPrimary?: boolean;
}

export interface AttachmentsTabProps {
  applicantId: string;
  attachments: Attachment[];
  onRefresh?: () => void;
  canUpload?: boolean;
  canDelete?: boolean;
}
