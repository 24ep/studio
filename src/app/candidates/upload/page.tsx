"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, XCircle, FileText, Plus, Trash2, UploadCloud } from "lucide-react";
import { CandidateQueueProvider, CandidateImportUploadQueue } from "@/components/candidates/CandidateImportUploadQueue";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose, DialogFooter } from "@/components/ui/dialog";
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-hot-toast';
import type { Position } from '@/lib/types';

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

interface UploadSet {
  id: string;
  files: File[];
  selectedPositionId: string;
  selectedPositionTitle?: string;
}

function UploadPageContent() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadSets, setUploadSets] = useState<UploadSet[]>([]);
  const [availablePositions, setAvailablePositions] = useState<Position[]>([]);
  const [uploading, setUploading] = useState(false);
  const [currentSetId, setCurrentSetId] = useState<string | null>(null);

  // Fetch available positions
  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const response = await fetch('/api/positions?isOpen=true');
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
  const handleFiles = (files: FileList | null, setId?: string) => {
    if (!files) return;
    const targetSetId = setId || currentSetId;
    if (!targetSetId) return;

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

    setUploadSets(prev => prev.map(set => 
      set.id === targetSetId 
        ? { ...set, files: [...set.files, ...newFiles] }
        : set
    ));

    if (invalidFiles.length > 0) {
      toast.error(`${invalidFiles.length} file(s) were invalid and not added.`);
    }
  };

  // Drag-and-drop handlers
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    if (currentSetId) {
      handleFiles(e.dataTransfer.files, currentSetId);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, setId?: string) => {
    handleFiles(e.target.files, setId);
  };

  // Add new upload set
  const addUploadSet = () => {
    const newSet: UploadSet = {
      id: uuidv4(),
      files: [],
      selectedPositionId: "",
    };
    setUploadSets(prev => [...prev, newSet]);
    setCurrentSetId(newSet.id);
  };

  // Remove upload set
  const removeUploadSet = (setId: string) => {
    setUploadSets(prev => prev.filter(set => set.id !== setId));
    if (currentSetId === setId) {
      setCurrentSetId(uploadSets.length > 1 ? uploadSets[0].id : null);
    }
  };

  // Remove file from set
  const removeFileFromSet = (setId: string, file: File) => {
    setUploadSets(prev => prev.map(set => 
      set.id === setId 
        ? { ...set, files: set.files.filter(f => f !== file) }
        : set
    ));
  };

  // Update position selection for a set
  const updateSetPosition = (setId: string, positionId: string) => {
    const selectedPosition = availablePositions.find(p => p.id === positionId);
    setUploadSets(prev => prev.map(set => 
      set.id === setId 
        ? { 
            ...set, 
            selectedPositionId: positionId,
            selectedPositionTitle: selectedPosition?.title
          }
        : set
    ));
  };

  // Confirm upload
  const handleConfirmUpload = async () => {
    setUploading(true);
    const batchId = uuidv4();
    const now = new Date().toISOString();

    try {
      // Process each set
      for (const set of uploadSets) {
        if (set.files.length === 0) continue;

        // Upload files for this set
        const formData = new FormData();
        set.files.forEach((file) => {
          formData.append('files', file);
        });

        const uploadRes = await fetch('/api/upload-queue/upload-file', {
          method: 'POST',
          body: formData
        });

        if (!uploadRes.ok) {
          throw new Error(`File upload failed for set ${set.id}`);
        }

        const { results } = await uploadRes.json();

        // Create queue entries for each file with position info
        await Promise.all(results.map(async (result: any, idx: number) => {
          if (result.status === 'success') {
            const queueData = {
              file_name: result.file_name,
              file_size: set.files[idx]?.size || 0,
              status: 'queued',
              source: 'bulk',
              upload_id: batchId,
              upload_date: now,
              file_path: result.file_path,
              webhook_payload: {
                targetPositionId: set.selectedPositionId || null,
                targetPositionTitle: set.selectedPositionTitle || null,
                uploadSetId: set.id
              }
            };

            await fetch('/api/upload-queue', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(queueData)
            });
          } else {
            toast.error(`${result.file_name}: ${result.error || 'Upload failed'}`);
          }
        }));
      }

      setUploadSets([]);
      setDialogOpen(false);
      toast.success('Bulk upload completed successfully');
    } catch (error) {
      console.error('Bulk upload error:', error);
      toast.error('Bulk upload failed');
    } finally {
      setUploading(false);
    }
  };

  const totalFiles = uploadSets.reduce((sum, set) => sum + set.files.length, 0);

  return (
    <div className="max-w-6xl mx-auto py-10">
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
          setUploadSets([]);
          setCurrentSetId(null);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bulk Upload Candidate CVs</DialogTitle>
            <DialogDescription>
              Upload multiple PDF files with position assignments. You can create multiple sets with different position targets.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Upload Sets */}
            {uploadSets.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No upload sets created yet.</p>
                <Button onClick={addUploadSet}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Upload Set
                </Button>
              </div>
            ) : (
              uploadSets.map((set, setIndex) => (
                <Card key={set.id} className={`${currentSetId === set.id ? 'ring-2 ring-primary' : ''}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Upload Set {setIndex + 1}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentSetId(set.id)}
                          disabled={currentSetId === set.id}
                        >
                          Select Files
                        </Button>
                        {uploadSets.length > 1 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeUploadSet(set.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Position Selection */}
                    <div>
                      <Label htmlFor={`position-${set.id}`}>Target Position (Optional)</Label>
                      <Select 
                        value={set.selectedPositionId} 
                        onValueChange={(value) => updateSetPosition(set.id, value)}
                      >
                        <SelectTrigger id={`position-${set.id}`} className="mt-1">
                          <SelectValue placeholder="Select a position to apply to..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None (General Application)</SelectItem>
                          {availablePositions.map(pos => (
                            <SelectItem key={pos.id} value={pos.id}>{pos.title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* File Upload Area */}
                    {currentSetId === set.id && (
                      <div
                        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                          dragActive ? "border-primary bg-primary/10" : "border-input"
                        }`}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onClick={() => document.getElementById(`file-input-${set.id}`)?.click()}
                        style={{ cursor: "pointer" }}
                      >
                        <Input
                          id={`file-input-${set.id}`}
                          type="file"
                          accept="application/pdf"
                          multiple
                          className="hidden"
                          onChange={(e) => handleInputChange(e, set.id)}
                        />
                        <UploadCloud className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">Drop PDF files here or click to select</p>
                        <p className="text-xs text-muted-foreground mt-1">Max {MAX_FILE_SIZE / (1024*1024)}MB per file</p>
                      </div>
                    )}

                    {/* Files List */}
                    {set.files.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Files in this set ({set.files.length}):</h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {set.files.map((file, idx) => (
                            <div key={`${file.name}-${idx}`} className="flex items-center justify-between bg-muted/50 rounded px-3 py-2">
                              <div className="flex items-center gap-2 truncate">
                                <FileText className="h-4 w-4 text-primary shrink-0" />
                                <span className="truncate" title={file.name}>{file.name}</span>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  ({formatBytes(file.size)})
                                </span>
                              </div>
                              <Button 
                                type="button" 
                                size="icon" 
                                variant="ghost" 
                                onClick={() => removeFileFromSet(set.id, file)}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}

            {/* Add New Set Button */}
            <Button 
              variant="outline" 
              onClick={addUploadSet}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Another Upload Set
            </Button>
          </div>

          <DialogFooter className="mt-6">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button 
              type="button" 
              onClick={handleConfirmUpload} 
              disabled={totalFiles === 0 || uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <UploadCloud className="mr-2 h-4 w-4" />
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