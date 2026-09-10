"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowUpTrayIcon as UploadCloud, ArrowPathIcon as Loader2 } from '@heroicons/react/24/outline';
import { useToast } from '@/hooks/use-toast';
import type { Applicant } from '@/lib/types';
import { getJsonObject, readJsonObject } from '@/lib/response-json';

interface UploadResumeModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  applicant: Applicant | null;
  onUploadSuccess: (updatedapplicant: Applicant) => void;
}

const UploadResumeModal = ({ isOpen, onOpenChange, applicant, onUploadSuccess }: UploadResumeModalProps) => {
  const { error: toastError, success: toastSuccess } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadTriggered, setUploadTriggered] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(selectedFile.type)) {
        toastError('Please select a PDF or Word document');
        return;
      }
      // Validate file size (5MB limit)
      if (selectedFile.size > 5 * 1024 * 1024) {
        toastError('File size must be less than 5MB');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file || !applicant) {
      toastError('Please select a file to upload');
      return;
    }
    if (!applicant.positionId) {
      toastError('Cannot upload resume: Applicant is not applied to any position. Please assign a position first.');
      return;
    }
    setIsUploading(true);
    setUploadTriggered(false);
    try {

      const formData = new FormData();
      formData.append('resume', file); // must be 'resume'
      formData.append('position_id', applicant.positionId); // must be 'position_id', ensure not empty
      // Include source_id if available
      if (applicant.sourceId) {
        formData.append('source_id', applicant.sourceId);
      }
      const url = `/api/resumes/upload?applicantId=${applicant.id}`; // applicantId as query param
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      const result = await readJsonObject(response);
      toastSuccess('Resume uploaded successfully');
      setUploadTriggered(true);
      const updatedApplicant = getJsonObject(result, 'applicant');
      if (typeof onUploadSuccess === 'function' && updatedApplicant) {
        onUploadSuccess(updatedApplicant as unknown as Applicant);
      }
      onOpenChange(false);
      setFile(null);
    } catch (error) {
      console.error('Upload error:', error);
      toastError('Failed to upload resume');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setFile(null);
      setUploadTriggered(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" dialogId="upload-resume-modal">
        <DialogHeader>
          <DialogTitle>Upload Resume</DialogTitle>
          <DialogDescription>
            Upload a new resume for {applicant?.name || 'this applicant'}. Supported formats: PDF, DOC, DOCX (max 5MB).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="resume-file">Select File</Label>
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="resume-file"
                className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50 hover:bg-muted"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <UploadCloud className="mb-4 h-8 w-8 text-muted-foreground" />
                  <p className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">PDF, DOC, or DOCX (max 5MB)</p>
                </div>
                <Input
                  id="resume-file"
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
              </label>
            </div>
            {file && (
              <p className="text-sm text-green-600">
                Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              onClick={handleUpload}
              disabled={!file || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload Resume'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UploadResumeModal; 
