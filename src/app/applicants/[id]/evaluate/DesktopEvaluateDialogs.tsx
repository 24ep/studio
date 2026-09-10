"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { FileText, MessageSquare, X } from "lucide-react";

import { getDesktopEvaluateAttachmentName } from "./utils";
import type { EvaluationAttachment } from "./types";

interface DesktopEvaluateDialogsProps {
  applicantId: string;
  selectedAttachment: EvaluationAttachment | null;
  remarkModalOpen: boolean;
  previewModalOpen: boolean;
  reportModalOpen: boolean;
  remarkText: string;
  onRemarkChange?: (text: string) => void;
  onRemarkModalOpenChange: (open: boolean) => void;
  onPreviewModalOpenChange: (open: boolean) => void;
  onReportModalOpenChange: (open: boolean) => void;
}

export function DesktopEvaluateDialogs({
  applicantId,
  selectedAttachment,
  remarkModalOpen,
  previewModalOpen,
  reportModalOpen,
  remarkText,
  onRemarkChange,
  onRemarkModalOpenChange,
  onPreviewModalOpenChange,
  onReportModalOpenChange,
}: DesktopEvaluateDialogsProps) {
  return (
    <>
      <Dialog open={remarkModalOpen} onOpenChange={onRemarkModalOpenChange}>
        <DialogContent className="sm:max-w-4xl p-0 overflow-hidden" dialogId="remark-modal">
          <DialogHeader className="px-8 py-6 border-b">
            <DialogTitle className="text-2xl font-semibold flex items-center gap-3">
              <MessageSquare className="h-6 w-6 text-primary" />
              Interview Remarks
            </DialogTitle>
          </DialogHeader>
          <div className="p-8 bg-muted/10">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-lg font-semibold">Remark to Interviewer</h3>
            </div>
            <Textarea
              value={remarkText}
              onChange={(event) => onRemarkChange?.(event.target.value)}
              placeholder="Enter your interview remarks about the Applicant..."
              className="min-h-[150px] resize-none text-base"
            />
            <div className="mt-4 w-full">
              <Button onClick={() => onRemarkModalOpenChange(false)} className="w-full" size="lg">
                Noted
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={previewModalOpen} onOpenChange={onPreviewModalOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] p-0" dialogId="file-preview-modal" hideCloseButton>
          <DialogHeader className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-red-500" />
                <DialogTitle>
                  {selectedAttachment ? getDesktopEvaluateAttachmentName(selectedAttachment) : "File Preview"}
                </DialogTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onPreviewModalOpenChange(false)}
                className="h-8 w-8 border-none shadow-none hover:bg-transparent focus:ring-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          <div className="flex-1 min-h-[600px]">
            {selectedAttachment && (
              <iframe
                src={selectedAttachment.url || ""}
                className="w-full h-[600px]"
                title="File Preview"
                style={{ border: "none" }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={reportModalOpen} onOpenChange={onReportModalOpenChange}>
        <DialogContent className="max-w-[90vw] w-full h-[90vh] p-0" dialogId="report-modal">
          <div className="flex-1 h-full w-full bg-background overflow-hidden">
            <iframe
              src={`/applicants/${applicantId}/evaluate-result`}
              className="w-full h-full border-0"
              title="Evaluation Report"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
