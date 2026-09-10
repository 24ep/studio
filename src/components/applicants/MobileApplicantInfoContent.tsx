"use client";

import {
  AcademicCapIcon as GraduationCap,
  BriefcaseIcon,
  DocumentIcon as FileIcon,
  DocumentTextIcon as FileText,
  PhotoIcon as ImageIcon,
} from '@heroicons/react/24/outline';
import { Badge } from '@/components/ui/badge';
import type { Applicant } from '@/lib/types';
import {
  getApplicantAttachmentDisplayName,
  getApplicantAttachmentUpdatedAt,
  type ApplicantAttachment,
  type ApplicantFilePreview,
} from './applicant-attachment-utils';
import { ApplicantInfoTab } from './tabs/ApplicantInfoTab';
import { EducationTab } from './tabs/EducationTab';
import { ExperienceTab } from './tabs/ExperienceTab';

interface MobileApplicantInfoContentProps {
  applicant: Applicant;
  applicantId: string;
  attachments: ApplicantAttachment[];
  education: unknown[];
  experience: unknown[];
  onFileSelect: (file: ApplicantFilePreview) => void;
}

function getFileIcon(fileName: string) {
  if (!fileName) return FileIcon;
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return ImageIcon;
  if (ext === 'pdf') return FileText;
  return FileIcon;
}

export function MobileApplicantInfoContent({
  applicant,
  applicantId,
  attachments,
  education,
  experience,
  onFileSelect,
}: MobileApplicantInfoContentProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold mb-3">Personal Information</h3>
        <div className="space-y-3">
          <ApplicantInfoTab
            applicant={applicant}
            isEditing={false}
          />
        </div>
      </div>

      {education.length > 0 && (
        <div>
          <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Education
          </h3>
          <EducationTab
            applicant={applicant}
            isEditing={false}
          />
        </div>
      )}

      {experience.length > 0 && (
        <div>
          <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
            <BriefcaseIcon className="h-4 w-4" />
            Experience
          </h3>
          <ExperienceTab
            applicant={applicant}
            isEditing={false}
          />
        </div>
      )}

      {attachments.length > 0 && (
        <div>
          <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Attachments ({attachments.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {attachments.map((attachment) => {
              const attachmentName = getApplicantAttachmentDisplayName(attachment);
              const AttachmentIcon = getFileIcon(attachmentName);
              return (
                <div
                  key={attachment.id}
                  className="border border-border rounded-lg p-3 flex flex-col items-center justify-center gap-2 min-h-[100px] cursor-pointer hover:shadow-md hover:border-primary/50 transition-all bg-card"
                  onClick={() => {
                    onFileSelect({
                      fileName: attachmentName,
                      url: attachment.url,
                      label: attachment.label,
                      updatedAt: getApplicantAttachmentUpdatedAt(attachment),
                      filePath: attachment.filePath,
                      applicantId,
                    });
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      event.currentTarget.click();
                    }
                  }}
                >
                  <AttachmentIcon className="h-8 w-8 text-muted-foreground" />
                  <p className="text-xs text-center truncate w-full" title={attachmentName}>
                    {attachmentName}
                  </p>
                  {attachment.label && (
                    <Badge variant="secondary" className="text-[10px]">
                      {attachment.label}
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
