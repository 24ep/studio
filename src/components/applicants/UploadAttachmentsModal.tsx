"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  UploadAttachmentActions,
  UploadAttachmentDropzone,
  UploadAttachmentFileList,
} from "./UploadAttachmentsModalParts";
import type {
  FileWithTag,
  UploadAttachmentsModalProps,
} from "./upload-attachments-modal-types";
import {
  getAttachmentValidationError,
  uploadApplicantAttachment,
} from "./upload-attachments-modal-utils";

const UploadAttachmentsModal = ({
  isOpen,
  onOpenChange,
  applicant,
  onUploadSuccess,
}: UploadAttachmentsModalProps) => {
  const [filesWithTags, setFilesWithTags] = useState<FileWithTag[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    const validFiles = selectedFiles.filter((file) => {
      const validationError = getAttachmentValidationError(file);
      if (validationError) {
        toast.error(validationError);
        return false;
      }

      return true;
    });

    if (validFiles.length > 0) {
      setFilesWithTags((prev) => [
        ...prev,
        ...validFiles.map((file) => ({ file, tag: "" })),
      ]);
    }

    event.target.value = "";
  };

  const removeFile = (index: number) => {
    setFilesWithTags((prev) => prev.filter((_, fileIndex) => fileIndex !== index));
  };

  const updateFileTag = (index: number, tag: string) => {
    setFilesWithTags((prev) =>
      prev.map((item, fileIndex) => (fileIndex === index ? { ...item, tag } : item)),
    );
  };

  const handleUpload = async () => {
    if (filesWithTags.length === 0) {
      toast.error("Please select files to upload");
      return;
    }
    if (!applicant) {
      toast.error("Applicant information not available");
      return;
    }

    setIsUploading(true);
    try {
      await Promise.all(
        filesWithTags.map((fileWithTag) => uploadApplicantAttachment(applicant.id, fileWithTag)),
      );

      toast.success(`${filesWithTags.length} attachment(s) uploaded successfully`);
      setFilesWithTags([]);
      onUploadSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload some files");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setFilesWithTags([]);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" dialogId="upload-attachments-modal">
        <DialogHeader>
          <DialogTitle>Upload Attachments</DialogTitle>
          <DialogDescription>
            Upload files for {applicant?.name || "this applicant"}. Supported formats: PDF,
            DOC, DOCX, Images, TXT (max 10MB each).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <UploadAttachmentDropzone
            isUploading={isUploading}
            onFileChange={handleFileChange}
          />
          <UploadAttachmentFileList
            filesWithTags={filesWithTags}
            isUploading={isUploading}
            onRemoveFile={removeFile}
            onUpdateFileTag={updateFileTag}
          />
          <UploadAttachmentActions
            fileCount={filesWithTags.length}
            isUploading={isUploading}
            onClose={handleClose}
            onUpload={handleUpload}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UploadAttachmentsModal;
