"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, XCircle, FileText, Plus, Trash2, UploadCloud } from "lucide-react";
import { CandidateQueueProvider, CandidateImportUploadQueue } from "@/components/candidates/CandidateImportUploadQueue";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose, DialogFooter } from "@/components/ui/dialog";
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-hot-toast';
import type { Position } from '@/lib/types';
import { useSession } from 'next-auth/react';

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function UploadPageContent() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedPositionId, setSelectedPositionId] = useState<string>("");
  const [availablePositions, setAvailablePositions] = useState<Position[]>([]);
  const [uploading, setUploading] = useState(false);
  const { data: session } = useSession();

  // Fetch available positions
  useEffect(() => {
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
  }, []);

  // Handle file selection
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
  // Remove file
  const removeFile = (file: File) => {
    setSelectedFiles(prev => prev.filter(f => f !== file));
  };
  // Confirm upload
  const handleConfirmUpload = async () => {
    setUploading(true);
    const batchId = uuidv4();
    const now = new Date().toISOString();
    try {
      if (selectedFiles.length === 0) return;
      // Upload files
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append('files', file);
      });
      const uploadRes = await fetch('/api/upload-queue/upload-file', {
        method: 'POST',
        body: formData
      });
      if (!uploadRes.ok) {
        throw new Error(`File upload failed`);
      }
      const { results } = await uploadRes.json();
      // Non-blocking upload: process each file via non-blocking endpoint
      const queueResults: any[] = [];
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
          };
          const queueRes = await fetch('/api/upload-queue', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(queueData)
          });
          let error = undefined;
          if (!queueRes.ok) {
            try {
              const errorData = await queueRes.json();
              error = errorData.error || 'Failed to add file to upload queue';
            } catch {
              error = 'Failed to add file to upload queue';
            }
          }
          queueResults.push({ file: result.file_name, success: queueRes.ok, error });
        } else {
          queueResults.push({ file: result.file_name, success: false, error: result.error || 'Upload failed' });
        }
      }));
      setSelectedFiles([]);
      setSelectedPositionId("");
      setDialogOpen(false);
      // Show summary to user
      const numSuccess = queueResults.filter(r => r.success).length;
      const numError = queueResults.length - numSuccess;
      if (numError === 0) {
        toast.success(`Bulk upload: ${numSuccess} file(s) queued for processing.`);
      } else {
        toast.error(`Bulk upload: ${numError} failed, ${numSuccess} queued.`);
        console.table(queueResults);
      }
      window.dispatchEvent(new CustomEvent('refreshCandidateQueue'));
    } catch (error) {
      console.error('Bulk upload error:', error);
      toast.error('Bulk upload failed');
    } finally {
      setUploading(false);
    }
  };
  const totalFiles = selectedFiles.length;
  return (
    <div className="mx-auto py-3 p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Bulk Upload Candidate CVs</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <UploadCloud className="mr-2 h-4 w-4" />
          Upload CVs
        </Button>
      </div>
      <CandidateImportUploadQueue />
      <Dialog open={dialogOpen} onOpenChange={open => {
        setDialogOpen(open);
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
                  ? "border-primary bg-gradient-to-br from-primary/10 to-accent/10 scale-105" 
                  : "border-input hover:border-primary/50 hover:bg-muted/20"
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => document.getElementById('file-input-bulk')?.click()}
              style={{ cursor: "pointer" }}
            >
              <Input
                id="file-input-bulk"
                type="file"
                accept="application/pdf"
                multiple
                className="hidden"
                onChange={handleInputChange}
              />
              <div className="bg-gradient-to-br from-primary/20 to-accent/20 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <UploadCloud className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Drop PDF files here or click to select</h3>
              <p className="text-muted-foreground mb-2">Support for multiple PDF files</p>
              <p className="text-xs text-muted-foreground">Max {MAX_FILE_SIZE / (1024*1024)}MB per file</p>
            </div>
            {selectedFiles.length > 0 && (
              <div className="bg-muted/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <h4 className="font-semibold">Files to upload ({selectedFiles.length})</h4>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedFiles.map((file, idx) => (
                    <div key={`${file.name}-${idx}`} className="flex items-center justify-between bg-background/80 rounded-lg px-4 py-3 border hover:shadow-sm transition-all">
                      <div className="flex items-center gap-3 truncate">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 flex items-center justify-center">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div className="truncate">
                          <p className="font-medium truncate" title={file.name}>{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatBytes(file.size)}
                          </p>
                        </div>
                      </div>
                      <Button 
                        type="button" 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => removeFile(file)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="flex items-center justify-between mt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button 
              type="button" 
              onClick={handleConfirmUpload} 
              disabled={totalFiles === 0 || uploading}
              className="btn-primary-gradient"
              size="lg"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <UploadCloud className="mr-2 h-5 w-5" />
                  Upload {totalFiles} File{totalFiles !== 1 ? 's' : ''}
                </>
              )}
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