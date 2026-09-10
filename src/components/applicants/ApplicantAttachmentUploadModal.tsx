import React, { useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowUpTrayIcon as UploadCloud, XMarkIcon as X } from '@heroicons/react/24/outline';

interface ApplicantAttachmentUploadModalProps {
  applicantId: string;
  open: boolean;
  onClose: () => void;
  onUploadSuccess?: () => void;
}

export const ApplicantAttachmentUploadModal: React.FC<ApplicantAttachmentUploadModalProps> = ({
  applicantId,
  open,
  onClose,
  onUploadSuccess,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFiles(e.dataTransfer.files);
    }
  };

  const handleFiles = async (files: FileList) => {
    setError(null);
    setUploading(true);
    setProgress(0);
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append('attachments', file);
      });
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `/api/applicants/${applicantId}/resumes`);
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          setProgress(Math.round((event.loaded / event.total) * 100));
        }
      };
      xhr.onload = () => {
        setUploading(false);
        if (xhr.status >= 200 && xhr.status < 300) {
          setProgress(100);
          if (onUploadSuccess) onUploadSuccess();
          onClose();
        } else {
          setError('Upload failed.');
        }
      };
      xhr.onerror = () => {
        setUploading(false);
        setError('Upload failed.');
      };
      xhr.send(formData);
    } catch (err) {
      setUploading(false);
      setError('Upload failed.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Attachment</DialogTitle>
          <DialogDescription>Drag and drop files here, or click to select files to upload as attachments.</DialogDescription>
        </DialogHeader>
        <div
          className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center transition-colors cursor-pointer ${dragActive ? 'border-primary bg-primary/10' : 'border-border bg-muted'}`}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{ minHeight: 180 }}
         role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.currentTarget.click(); } }}>
          <UploadCloud className="h-10 w-10 mb-2 text-primary" />
          <span className="text-base font-medium mb-1">Drag & drop files here</span>
          <span className="text-sm text-muted-foreground">or click to select files</span>
          <input
            type="file"
            multiple
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={e => {
              if (e.target.files) handleFiles(e.target.files);
            }}
            disabled={uploading}
          />
        </div>
        {uploading && (
          <div className="mt-4 w-full">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-2 bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
            <div className="text-xs text-muted-foreground mt-1">Uploading... {progress}%</div>
          </div>
        )}
        {error && <div className="text-destructive text-sm mt-2">{error}</div>}
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose} disabled={uploading}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ApplicantAttachmentUploadModal; 