"use client";

import { DocumentTextIcon as FileText } from '@heroicons/react/24/outline';
import { sanitizeUrl } from '@/lib/utils';
import type { ApplicantEvaluationAttachment } from './applicant-evaluation-modal-api';
import type { ApplicantEvaluationSelectedFile } from './use-applicant-evaluation-modal-state';

interface ApplicantAssetsGridProps {
  attachments: ApplicantEvaluationAttachment[];
  applicantId: string;
  onAttachmentSelect: (attachment: ApplicantEvaluationSelectedFile) => void;
}

export function ApplicantAssetsGrid({
  attachments,
  applicantId,
  onAttachmentSelect,
}: ApplicantAssetsGridProps) {
  return (
    <div className="p-6 border-b border-gray-200">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <FileText className="h-5 w-5" />
        Applicant Assets
      </h3>
      <div className="grid grid-cols-5 gap-2 sm:gap-4">
        {attachments.length === 0 ? (
          <div className="col-span-full text-sm text-gray-500">No attachments</div>
        ) : (
          attachments.map((attachment) => (
            <ApplicantAssetButton
              key={attachment.id}
              attachment={attachment}
              applicantId={applicantId}
              onAttachmentSelect={onAttachmentSelect}
            />
          ))
        )}
      </div>
    </div>
  );
}

function ApplicantAssetButton({
  attachment,
  applicantId,
  onAttachmentSelect,
}: {
  attachment: ApplicantEvaluationAttachment;
  applicantId: string;
  onAttachmentSelect: (attachment: ApplicantEvaluationSelectedFile) => void;
}) {
  const fileName = attachment.fileName || attachment.originalName || attachment.name || 'Attachment';
  const url = attachment.url || '';
  const isImage = fileName.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i);
  const isAiAttachment = Boolean(attachment.label && attachment.label.toLowerCase().includes('ai'));
  const previewUrl = sanitizeUrl(url.includes('/api/secure-file/stream')
    ? url.replace('/api/secure-file/stream', '/api/secure-file/preview')
    : url);

  return (
    <button
      type="button"
      onClick={() => {
        onAttachmentSelect({
          fileName,
          url,
          filePath: typeof attachment.filePath === 'string' ? attachment.filePath : undefined,
          applicantId,
          label: typeof attachment.label === 'string' ? attachment.label : undefined,
          updatedAt: typeof attachment.updatedAt === 'string' ? attachment.updatedAt : undefined,
          fileSize: typeof attachment.fileSize === 'number' || typeof attachment.fileSize === 'string' ? attachment.fileSize : undefined,
        });
      }}
      className="group text-left relative"
      title={fileName}
    >
      {isImage ? (
        <div className="relative h-20 sm:h-28 w-full">
          <img
            src={previewUrl}
            alt={fileName}
            className="h-full w-full object-cover rounded-xl border"
            onError={(event) => {
              const target = event.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
          <AttachmentBadges label={attachment.label} isAiAttachment={isAiAttachment} />
        </div>
      ) : (
        <div className="relative h-20 sm:h-28 rounded-xl bg-muted flex items-center justify-center border">
          <FileText className="w-4 h-4 sm:w-6 sm:h-6 text-muted-foreground" />
          <AttachmentBadges label={attachment.label} isAiAttachment={isAiAttachment} />
        </div>
      )}
      <div className="mt-2 text-xs text-muted-foreground line-clamp-2">{fileName}</div>
    </button>
  );
}

function AttachmentBadges({
  label,
  isAiAttachment,
}: {
  label?: string;
  isAiAttachment: boolean;
}) {
  return (
    <>
      {label && (
        <span className="absolute top-1 right-1 z-10 px-1.5 py-0.5 text-[10px] font-medium rounded bg-black/60 text-white backdrop-blur-sm">
          {label}
        </span>
      )}
      {isAiAttachment && (
        <span className="absolute -top-2 -left-2 z-10 px-2 py-0.5 text-[10px] font-bold rounded-full bg-primary text-primary-foreground shadow">
          AI
        </span>
      )}
    </>
  );
}
