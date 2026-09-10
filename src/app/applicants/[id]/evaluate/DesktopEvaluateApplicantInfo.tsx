"use client";

import { Briefcase, FileText, Paperclip, Sparkles } from 'lucide-react';
import {
  getDesktopEvaluateAiEvaluationItems,
  getDesktopEvaluateAttachmentFileName,
  getDesktopEvaluateAttachmentLabel,
} from './utils';
import type { DesktopApplicantInfoProps } from './DesktopEvaluatePagePartTypes';

export function DesktopEvaluateApplicantInfo({
  applicantData,
  attachments,
  onAttachmentPreview,
}: DesktopApplicantInfoProps) {
  const aiEvaluationItems = getDesktopEvaluateAiEvaluationItems(applicantData);

  return (
    <div className="w-full lg:w-[40%] p-8 lg:pl-12 lg:pr-12 space-y-10 border-r border-border/40">
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
          <Briefcase className="h-4 w-4" />
          Apply for
        </h3>
        <div className="text-lg font-medium border-b border-border/40 pb-4">
          {applicantData?.position?.title || applicantData?.positionTitle || 'Position Name'}
        </div>
      </div>

      <DesktopEvaluateAttachments
        attachments={attachments}
        onAttachmentPreview={onAttachmentPreview}
      />

      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          AI Evaluate
        </h3>
        <div className="border-b border-border/40 pb-8">
          {aiEvaluationItems.length > 0 ? (
            <div className="space-y-2">
              {aiEvaluationItems.map((item, index) => (
                <div key={index} className="text-sm text-foreground/80 leading-relaxed flex gap-2">
                  <span className="flex-shrink-0">&bull;</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-foreground/80 leading-relaxed">
              No evaluation data available.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DesktopEvaluateAttachments({
  attachments,
  onAttachmentPreview,
}: Pick<DesktopApplicantInfoProps, 'attachments' | 'onAttachmentPreview'>) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
        <Paperclip className="h-4 w-4" />
        Attachments
      </h3>
      <div className="flex flex-wrap gap-4 border-b border-border/40 pb-8">
        {attachments.map((attachment) => (
          <div
            key={attachment.id}
            className="flex items-center gap-3 bg-background border border-border/50 rounded-xl p-3 pr-6 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onAttachmentPreview(attachment)}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onAttachmentPreview(attachment);
              }
            }}
          >
            <div className="h-10 w-10 bg-red-50 rounded-lg flex items-center justify-center text-red-500 flex-shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-foreground truncate max-w-[200px]">
                {getDesktopEvaluateAttachmentFileName(attachment)}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground w-fit mt-1">
                {getDesktopEvaluateAttachmentLabel(attachment)}
              </span>
            </div>
          </div>
        ))}
        {attachments.length === 0 && (
          <div className="text-sm text-muted-foreground italic">No attachments</div>
        )}
      </div>
    </div>
  );
}
