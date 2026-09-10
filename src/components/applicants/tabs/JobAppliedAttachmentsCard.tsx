import { useState } from 'react';
import { FileText, Paperclip, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface JobAppliedAttachmentsCardProps {
  resumes: JobAppliedAttachment[];
}

export interface JobAppliedAttachment {
  id?: string;
  url?: string;
  label?: string;
  filename?: string;
  fileName?: string;
  name?: string;
  originalName?: string;
}

function getAttachmentName(attachment: JobAppliedAttachment) {
  return attachment.filename ||
    attachment.fileName ||
    attachment.name ||
    attachment.originalName ||
    'Attachment';
}

function getAttachmentKey(attachment: JobAppliedAttachment, index: number) {
  return attachment.id || attachment.url || `${getAttachmentName(attachment)}-${index}`;
}

export function JobAppliedAttachmentsCard({ resumes }: JobAppliedAttachmentsCardProps) {
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<JobAppliedAttachment | null>(null);

  return (
    <>
      <section className="space-y-3">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Paperclip className="h-4 w-4 text-muted-foreground" />
            Attachments
          </h3>
        </div>
        <div className="flex flex-wrap gap-4">
          {resumes.map((attachment, index) => (
            <div
              key={getAttachmentKey(attachment, index)}
              className="flex items-center gap-3 bg-background border border-border/50 rounded-xl p-3 pr-6 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => {
                setSelectedAttachment(attachment);
                setIsPreviewModalOpen(true);
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
              <div className="h-10 w-10 bg-red-50 rounded-lg flex items-center justify-center text-red-500 flex-shrink-0">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-foreground truncate max-w-[200px]">{getAttachmentName(attachment)}</span>
                <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground w-fit mt-1">{attachment.label || 'PDF'}</span>
              </div>
            </div>
          ))}
          {resumes.length === 0 && (
            <div className="text-sm text-muted-foreground italic">No attachments</div>
          )}
        </div>
      </section>

      <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
        <DialogContent className="max-w-5xl h-[90vh] p-0 flex flex-col overflow-hidden" dialogId="file-preview-modal" hideCloseButton>
          <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-red-500" />
                <DialogTitle>{selectedAttachment ? getAttachmentName(selectedAttachment) : 'File Preview'}</DialogTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsPreviewModalOpen(false)}
                className="h-8 w-8 border-none shadow-none hover:bg-transparent focus:ring-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          <div className="flex-1 bg-zinc-100 dark:bg-zinc-900 min-h-0">
            {selectedAttachment && (
              <iframe
                src={selectedAttachment.url}
                className="w-full h-full"
                title="File Preview"
                style={{ border: 'none' }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
