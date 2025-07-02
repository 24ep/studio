"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-hot-toast';
import type { Position } from '@/lib/types';
import { useSession } from 'next-auth/react';
import { UploadCloud, Loader2, Trash2 } from "lucide-react";

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

interface BulkUploadCVsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadSuccess?: () => void;
}

export function BulkUploadCVsModal({ isOpen, onOpenChange, onUploadSuccess }: BulkUploadCVsModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedPositionId, setSelectedPositionId] = useState<string>("");
  const [availablePositions, setAvailablePositions] = useState<Position[]>([]);
  const [uploading, setUploading] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    if (!isOpen) return;
    const fetchPositions = async () => {
      try {
        const response = await fetch('/api/positions');
        if (!response.ok) {
          throw new Error('Failed to fetch positions');
        }
        const result = await response.json();
        const data = Array.isArray(result) ? result : (result.data || []);
        setAvailablePositions(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching positions:", error);
        toast.error("Could not load positions for selection.");
      }
    };
    fetchPositions();
  }, [isOpen]);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const newFiles: File[] = [];
    const invalidFiles: { name: string; reason: string }[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type !== "application/pdf") {
        invalidFiles.push({ name: file.name, reason: "Invalid file type" });
        toast.error(`${file.name}: Invalid file type`);
      } else if (file.size > MAX_FILE_SIZE) {
        invalidFiles.push({ name: file.name, reason: `File too large (max ${MAX_FILE_SIZE / (1024*1024)}MB)` });
        toast.error(`${file.name}: File too large (max ${MAX_FILE_SIZE / (1024*1024)}MB)`);
      } else {
        newFiles.push(file);
      }
    }
    setSelectedFiles(prev => [...prev, ...newFiles]);
    if (invalidFiles.length > 0) {
      toast.error(`${invalidFiles.length} file(s) were invalid and not added.`);
    }
  };

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
  const removeFile = (file: File) => {
    setSelectedFiles(prev => prev.filter(f => f !== file));
  };

  // Helper to add a file to the upload queue and handle errors
  async function addToUploadQueue(queueData: any, fileName: string) {
    try {
      const queueRes = await fetch('/api/upload-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(queueData)
      });
      if (!queueRes.ok) {
        let errorMsg = 'Failed to add file to upload queue';
        try {
          const errorData = await queueRes.json();
          errorMsg = errorData.error || errorMsg;
          console.error('Upload queue POST error:', errorData);
        } catch (parseErr) {
          console.error('Upload queue POST error (non-JSON):', queueRes);
        }
        toast.error(`${fileName}: ${errorMsg}`);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Network or unexpected error during upload queue POST:', err);
      toast.error(`${fileName}: Unexpected error adding to upload queue`);
      return false;
    }
  }

  const handleConfirmUpload = async () => {
    setUploading(true);
    const batchId = uuidv4();
    const now = new Date().toISOString();
    try {
      if (selectedFiles.length === 0) return;
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append('files', file);
      });
      const uploadRes = await fetch('/api/upload-queue/upload-file', {
        method: 'POST',
        body: formData
      });
      if (!uploadRes.ok) {
        let errorMsg = 'File upload failed';
        try {
          const errorData = await uploadRes.json();
          errorMsg = errorData.error || errorMsg;
          console.error('File upload error:', errorData);
        } catch (parseErr) {
          console.error('File upload error (non-JSON):', uploadRes);
        }
        toast.error(errorMsg);
        return;
      }
      const { results } = await uploadRes.json();
      // Track if any file failed to queue
      let anyQueueError = false;
      await Promise.all(results.map(async (result: any, idx: number) => {
        if (result.status === 'success') {
          const queueData = {
            file_name: result.file_name,
            file_size: selectedFiles[idx]?.size || 0,
            status: 'queued',
            source: 'bulk',
            upload_id: batchId,
            upload_date: now,
            file_path: result.file_path,
            webhook_payload: {
              targetPositionId: selectedPositionId || null,
              uploadBatch: batchId
            },
            created_by: session?.user?.id,
          };
          const ok = await addToUploadQueue(queueData, result.file_name);
          if (!ok) anyQueueError = true;
        } else {
          toast.error(`${result.file_name}: ${result.error || 'Upload failed'}`);
          anyQueueError = true;
        }
      }));
      setSelectedFiles([]);
      setSelectedPositionId("");
      onOpenChange(false);
      if (!anyQueueError) {
        toast.success('Bulk upload completed successfully');
      } else {
        toast.error('Some files failed to queue. Check errors above.');
      }
      if (onUploadSuccess) onUploadSuccess();
      window.dispatchEvent(new CustomEvent('refreshCandidateQueue'));
    } catch (error) {
      console.error('Bulk upload error:', error);
      toast.error('Bulk upload failed (unexpected error)');
    } finally {
      setUploading(false);
    }
  };
  const totalFiles = selectedFiles.length;
  return (
    <Dialog open={isOpen} onOpenChange={open => {
      onOpenChange(open);
      if (!open) {
        setSelectedFiles([]);
        setSelectedPositionId("");
      }
    }}>
      <DialogContent className="max-w-lg w-full">
        <DialogHeader>
          <DialogTitle>Bulk Upload Candidate CVs</DialogTitle>
          <DialogDescription>
            Upload multiple PDF resumes and (optionally) assign them to a position.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="position-select">Assign to Position (optional)</Label>
            <Select value={(selectedPositionId === "" ? "__NONE__" : selectedPositionId) || ''} onValueChange={value => setSelectedPositionId(value === "__NONE__" ? "" : value)}>
              <SelectTrigger id="position-select" className="mt-2">
                <SelectValue placeholder="Select a position..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__NONE__">None (General Application)</SelectItem>
                {availablePositions.map(pos => (
                  <SelectItem key={pos.id} value={pos.id}>{pos.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
              dragActive 
                ? 'border-primary bg-primary/10' 
                : 'border-border bg-muted/30'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => document.getElementById('bulk-upload-cv-input')?.click()}
            style={{ cursor: 'pointer' }}
          >
            <input
              id="bulk-upload-cv-input"
              type="file"
              accept="application/pdf"
              multiple
              className="hidden"
              onChange={handleInputChange}
            />
            <UploadCloud className="mx-auto mb-2 h-8 w-8 text-primary" />
            <p className="text-base font-medium mb-2">Drag and drop PDF files here, or click to select files</p>
            <p className="text-xs text-muted-foreground">Only PDF files are accepted. Max size: 500MB each.</p>
            {totalFiles > 0 && (
              <div className="mt-4 flex flex-col gap-2">
                {selectedFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-background rounded px-2 py-1 border border-border">
                    <span className="truncate max-w-xs">{file.name}</span>
                    <Button type="button" size="icon" variant="ghost" onClick={e => { e.stopPropagation(); removeFile(file); }}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={uploading}>Cancel</Button>
          </DialogClose>
          <Button onClick={handleConfirmUpload} disabled={selectedFiles.length === 0 || uploading}>
            {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default BulkUploadCVsModal; 