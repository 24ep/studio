"use client";

import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, XCircle, CheckCircle, FileText, RotateCcw, ExternalLink, AlertCircle, Eye } from "lucide-react";
import Link from "next/link";
import { CandidateQueueProvider, CandidateImportUploadQueue, useCandidateQueue } from "@/components/candidates/CandidateImportUploadQueue";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose, DialogFooter } from "@/components/ui/dialog";
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '../../../hooks/use-toast';

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const ACCEPTED_FILE_TYPES = ["application/pdf"];

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function UploadPageContent() {
  const { addJob } = useCandidateQueue();
  const { error } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [invalidFiles, setInvalidFiles] = useState<{ name: string; reason: string }[]>([]);
  const [uploadBatchId, setUploadBatchId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Handle file selection (from input or drop)
  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const newFiles: File[] = [];
    const newInvalidFiles: { name: string; reason: string }[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type !== "application/pdf") {
        newInvalidFiles.push({ name: file.name, reason: "Invalid file type" });
        error(`${file.name}: Invalid file type`);
      } else if (file.size > 500 * 1024 * 1024) {
        newInvalidFiles.push({ name: file.name, reason: "File too large (max 500MB)" });
        error(`${file.name}: File too large (max 500MB)`);
      } else if (stagedFiles.some(f => f.name === file.name && f.size === file.size)) {
        newInvalidFiles.push({ name: file.name, reason: "Duplicate file" });
        error(`${file.name}: Duplicate file`);
      } else {
        newFiles.push(file);
      }
    }
    setStagedFiles(prev => [...prev, ...newFiles]);
    setInvalidFiles(newInvalidFiles);
  };

  // Drag-and-drop handlers
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  // Remove a staged file
  const removeStagedFile = (file: File) => {
    setStagedFiles(prev => prev.filter(f => !(f.name === file.name && f.size === file.size)));
  };

  // Confirm upload
  const handleConfirmUpload = async () => {
    setUploading(true);
    const batchId = uuidv4();
    const now = new Date().toISOString();
    try {
      // 1. Upload all files in a single request
      const formData = new FormData();
      stagedFiles.forEach((file) => {
        formData.append('files', file);
      });
      const uploadRes = await fetch('/api/upload-queue/upload-file', {
        method: 'POST',
        body: formData
      });
      if (!uploadRes.ok) {
        error('File upload failed');
        return;
      }
      const { results } = await uploadRes.json();
      // 2. For each successful upload, POST metadata to queue
      await Promise.all(results.map(async (result: any, idx: number) => {
        if (result.status === 'success') {
          await fetch('/api/upload-queue', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              file_name: result.file_name,
              file_size: stagedFiles[idx]?.size || 0,
              status: 'queued',
              source: 'bulk',
              upload_id: batchId,
              upload_date: now,
              file_path: result.file_path
            })
          });
        } else {
          error(`${result.file_name}: ${result.error || 'Upload failed'}`);
        }
      }));
      setStagedFiles([]);
      setDialogOpen(false);
      setUploadBatchId(batchId);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Bulk Upload Candidate CVs</h1>
        <Button onClick={() => setDialogOpen(true)}>
          Upload CV
        </Button>
      </div>
      {/* Filter and Table will be handled in the queue component */}
      <CandidateImportUploadQueue />
      <Dialog open={dialogOpen} onOpenChange={open => {
        setDialogOpen(open);
        if (!open) setStagedFiles([]);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Candidate CVs (PDF)</DialogTitle>
            <DialogDescription>
              Drag and drop PDF files here, or click to select files. Max 10MB each.
            </DialogDescription>
          </DialogHeader>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive ? "border-primary bg-primary/10" : "border-input"}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => document.getElementById("bulk-upload-input")?.click()}
            style={{ cursor: "pointer" }}
          >
            <Input
              id="bulk-upload-input"
              type="file"
              accept="application/pdf"
              multiple
              className="hidden"
              onChange={handleInputChange}
            />
            <p className="text-muted-foreground">Drop PDF files here or click to select</p>
          </div>
          {invalidFiles.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2 text-destructive">Invalid files:</h4>
              <ul className="space-y-1">
                {invalidFiles.map((file, idx) => (
                  <li key={file.name + idx} className="flex items-center text-destructive text-sm">
                    <XCircle className="mr-2 w-4 h-4" />
                    <span>{file.name} - {file.reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {stagedFiles.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Files to upload:</h4>
              <ul className="space-y-2">
                {stagedFiles.map((file, idx) => (
                  <li key={file.name + file.size + idx} className="flex items-center justify-between bg-muted/50 rounded px-3 py-2">
                    <span className="truncate max-w-xs" title={file.name}>{file.name} <span className="text-xs text-muted-foreground">({(file.size / 1024 / 1024).toFixed(2)} MB)</span></span>
                    <Button type="button" size="icon" variant="ghost" onClick={() => removeStagedFile(file)}><span className="sr-only">Remove</span>✕</Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={() => setStagedFiles([])}>Cancel</Button>
            </DialogClose>
            <Button type="button" onClick={handleConfirmUpload} disabled={stagedFiles.length === 0 || uploading}>
              {uploading ? 'Uploading...' : 'Confirm Upload'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function MultiCandidateUploadPage() {
  return (
    <CandidateQueueProvider>
      <UploadPageContent />
    </CandidateQueueProvider>
  );
} 