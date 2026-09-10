import { useState } from 'react';
import { toast } from 'react-hot-toast';

import { FileViewerModal } from '../ui/file-viewer-modal';
import UploadAttachmentsModal from './UploadAttachmentsModal';
import type { ApplicantAttachment } from './applicant-attachment-utils';
import {
  deleteApplicantAttachment,
  setApplicantPrimaryResume,
} from './applicant-resumes-section-api';
import {
  ApplicantResumesList,
  ApplicantResumesToolbar,
} from './ApplicantResumesSectionParts';
import {
  buildApplicantResumeViewerFile,
  getApplicantResumeErrorMessage,
  sortApplicantAttachmentsByDate,
  type ApplicantResumeViewerFile,
} from './applicant-resumes-section-utils';

interface ApplicantResumesSectionProps {
  applicantId: string;
  resumes: ApplicantAttachment[];
  isEditing: boolean;
  onResumesChange: () => void;
}

export default function ApplicantResumesSection({
  applicantId,
  resumes,
  isEditing,
  onResumesChange,
}: ApplicantResumesSectionProps) {
  const [sortDesc, setSortDesc] = useState(true);
  const [selectedFile, setSelectedFile] = useState<ApplicantResumeViewerFile | null>(null);
  const [isFileViewerOpen, setIsFileViewerOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const sortedAttachments = sortApplicantAttachmentsByDate(resumes, sortDesc);

  const handleFileClick = (attachment: ApplicantAttachment) => {
    setSelectedFile(buildApplicantResumeViewerFile(attachment, applicantId));
    setIsFileViewerOpen(true);
  };

  const handleSetPrimary = async (attachmentId: string) => {
    try {
      await setApplicantPrimaryResume(applicantId, attachmentId);
      onResumesChange();
      toast.success('Primary resume updated');
    } catch (err) {
      console.error('Error setting primary:', err);
      toast.error('Failed to set primary resume');
    }
  };

  const handleDelete = async (attachmentId: string) => {
    if (!confirm('Are you sure you want to delete this attachment? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteApplicantAttachment(applicantId, attachmentId);
      onResumesChange();
      toast.success('Attachment deleted successfully');
    } catch (err) {
      console.error('Error deleting attachment:', err);
      toast.error(getApplicantResumeErrorMessage(err, 'Failed to delete attachment'));
    }
  };

  return (
    <div className="h-full flex flex-col min-h-0 p-4">
      <ApplicantResumesToolbar
        sortDesc={sortDesc}
        uploading={false}
        onOpenUpload={() => setIsUploadModalOpen(true)}
        onToggleSort={() => setSortDesc(current => !current)}
      />

      <ApplicantResumesList
        attachments={sortedAttachments}
        isEditing={isEditing}
        onDelete={handleDelete}
        onFileClick={handleFileClick}
        onSetPrimary={handleSetPrimary}
      />

      <FileViewerModal
        isOpen={isFileViewerOpen}
        onOpenChange={setIsFileViewerOpen}
        file={selectedFile}
      />

      <UploadAttachmentsModal
        isOpen={isUploadModalOpen}
        onOpenChange={(open) => {
          if (!open && isUploadModalOpen) {
            setIsUploadModalOpen(false);
          }
        }}
        applicant={{ id: applicantId }}
        onUploadSuccess={onResumesChange}
      />
    </div>
  );
}
