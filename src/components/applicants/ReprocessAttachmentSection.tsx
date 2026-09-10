"use client";

import {
  ArrowDownTrayIcon as Download,
  CalendarIcon as Calendar,
  DocumentTextIcon as FileText,
  ArrowPathIcon as Loader2,
} from "@heroicons/react/24/outline";
import type { Ref } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  downloadAttachment,
  formatAttachmentDate,
  getAttachmentPreviewUrl,
  isPdfAttachment,
  type ReprocessAttachment,
} from "./reprocess-modal-utils";

interface AttachmentSectionProps {
  selectedAttachment: string;
  selectedAttachmentData: ReprocessAttachment | null;
  validAttachments: ReprocessAttachment[];
  isPreviewLoading: boolean;
  iframeRef: Ref<HTMLIFrameElement>;
  onAttachmentChange: (value: string) => void;
  onPreviewLoad: () => void;
  onPreviewError: () => void;
}

export function ReprocessAttachmentSection({
  selectedAttachment,
  selectedAttachmentData,
  validAttachments,
  isPreviewLoading,
  iframeRef,
  onAttachmentChange,
  onPreviewLoad,
  onPreviewError,
}: AttachmentSectionProps) {
  return (
    <div className="space-y-3">
      <Label htmlFor="attachment-select">Select Attachment</Label>
      <Select value={selectedAttachment} onValueChange={onAttachmentChange} disabled={false}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select an attachment to re-process..." />
        </SelectTrigger>
        <SelectContent>
          {validAttachments.map((attachment) => (
            <SelectItem key={attachment.id} value={attachment.id}>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>{attachment.fileName}</span>
                {attachment.isPrimary && (
                  <Badge variant="secondary" className="text-xs">
                    Primary
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedAttachmentData && (
        <SelectedAttachmentCard
          attachment={selectedAttachmentData}
          isPreviewLoading={isPreviewLoading}
          iframeRef={iframeRef}
          onPreviewLoad={onPreviewLoad}
          onPreviewError={onPreviewError}
        />
      )}
    </div>
  );
}

function SelectedAttachmentCard({
  attachment,
  isPreviewLoading,
  iframeRef,
  onPreviewLoad,
  onPreviewError,
}: {
  attachment: ReprocessAttachment;
  isPreviewLoading: boolean;
  iframeRef: Ref<HTMLIFrameElement>;
  onPreviewLoad: () => void;
  onPreviewError: () => void;
}) {
  return (
    <Card className="mt-3">
      <CardContent className="pt-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="font-medium">{attachment.fileName}</div>
                <div className="text-sm text-muted-foreground flex items-center gap-4">
                  {attachment.label && (
                    <span className="text-xs bg-muted px-2 py-1 rounded">
                      {attachment.label}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatAttachmentDate(attachment.uploadedAt)}
                  </span>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadAttachment(attachment)}
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
          </div>

          {isPdfAttachment(attachment.fileName) && (
            <PdfAttachmentPreview
              attachment={attachment}
              isPreviewLoading={isPreviewLoading}
              iframeRef={iframeRef}
              onPreviewLoad={onPreviewLoad}
              onPreviewError={onPreviewError}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function PdfAttachmentPreview({
  attachment,
  isPreviewLoading,
  iframeRef,
  onPreviewLoad,
  onPreviewError,
}: {
  attachment: ReprocessAttachment;
  isPreviewLoading: boolean;
  iframeRef: Ref<HTMLIFrameElement>;
  onPreviewLoad: () => void;
  onPreviewError: () => void;
}) {
  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      <div className="h-96 relative">
        {isPreviewLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">Loading preview...</span>
            </div>
          </div>
        )}
        <iframe
          ref={iframeRef}
          key={`thumbnail-${attachment.id}`}
          src={getAttachmentPreviewUrl(attachment)}
          className="w-full h-full"
          title="PDF Preview"
          loading="lazy"
          sandbox="allow-same-origin allow-scripts"
          onLoad={onPreviewLoad}
          onError={onPreviewError}
          style={{
            border: "none",
            outline: "none",
            pointerEvents: "auto",
            isolation: "isolate",
          }}
          data-modal-isolated="true"
        />
      </div>
    </div>
  );
}
