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
            selectedPositionId: positionId === 'none' ? '' : positionId,
            selectedPositionTitle: positionId === 'none' ? undefined : selectedPosition?.title
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
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden p-0">
          <div className="flex flex-col h-full">
            {/* Header with gradient background */}
            <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 p-6 border-b">
              <DialogHeader className="mb-0">
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Bulk Upload Candidate CVs
                </DialogTitle>
                <DialogDescription className="text-base">
                  Upload multiple PDF files with position assignments. Create multiple sets for different position targets.
                </DialogDescription>
              </DialogHeader>
            </div>

            {/* Main content area */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Upload Sets */}
                {uploadSets.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-2xl p-8 border-2 border-dashed border-primary/20">
                      <UploadCloud className="mx-auto h-16 w-16 text-primary/60 mb-4" />
                      <h3 className="text-xl font-semibold mb-2">No upload sets created yet</h3>
                      <p className="text-muted-foreground mb-6">Create your first upload set to get started</p>
                      <Button onClick={addUploadSet} size="lg" className="btn-primary-gradient">
                        <Plus className="mr-2 h-5 w-5" />
                        Create First Upload Set
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {uploadSets.map((set, setIndex) => (
                      <Card key={set.id} className={`card-gradient transition-all duration-300 ${
                        currentSetId === set.id 
                          ? 'ring-2 ring-primary/50 shadow-lg scale-[1.02]' 
                          : 'hover:shadow-md hover:scale-[1.01]'
                      }`}>
                        <CardHeader className="pb-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center text-white font-bold text-sm">
                                {setIndex + 1}
                              </div>
                              <CardTitle className="text-xl">Upload Set {setIndex + 1}</CardTitle>
                              {set.selectedPositionTitle && (
                                <Badge variant="secondary" className="ml-2">
                                  {set.selectedPositionTitle}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant={currentSetId === set.id ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentSetId(set.id)}
                                className={currentSetId === set.id ? "btn-primary-gradient" : ""}
                              >
                                {currentSetId === set.id ? "Active" : "Select Files"}
                              </Button>
                              {uploadSets.length > 1 && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeUploadSet(set.id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          {/* Position Selection */}
                          <div className="bg-muted/30 rounded-lg p-4">
                            <Label htmlFor={`position-${set.id}`} className="text-sm font-medium">
                              Target Position (Optional)
                            </Label>
                            <Select 
                              value={set.selectedPositionId} 
                              onValueChange={(value) => updateSetPosition(set.id, value)}
                            >
                              <SelectTrigger id={`position-${set.id}`} className="mt-2 input-gradient">
                                <SelectValue placeholder="Select a position to apply to..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">None (General Application)</SelectItem>
                                {availablePositions.map(pos => (
                                  <SelectItem key={pos.id} value={pos.id}>{pos.title}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* File Upload Area */}
                          {currentSetId === set.id && (
                            <div
                              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                                dragActive 
                                  ? "border-primary bg-gradient-to-br from-primary/10 to-accent/10 scale-105" 
                                  : "border-input hover:border-primary/50 hover:bg-muted/20"
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
                              <div className="bg-gradient-to-br from-primary/20 to-accent/20 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                                <UploadCloud className="h-10 w-10 text-primary" />
                              </div>
                              <h3 className="text-lg font-semibold mb-2">Drop PDF files here or click to select</h3>
                              <p className="text-muted-foreground mb-2">Support for multiple PDF files</p>
                              <p className="text-xs text-muted-foreground">Max {MAX_FILE_SIZE / (1024*1024)}MB per file</p>
                            </div>
                          )}

                          {/* Files List */}
                          {set.files.length > 0 && (
                            <div className="bg-muted/20 rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <FileText className="h-5 w-5 text-primary" />
                                <h4 className="font-semibold">Files in this set ({set.files.length})</h4>
                              </div>
                              <div className="space-y-2 max-h-48 overflow-y-auto">
                                {set.files.map((file, idx) => (
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
                                      onClick={() => removeFileFromSet(set.id, file)}
                                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
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
                    ))}
                  </div>
                )}

                {/* Add New Set Button */}
                {uploadSets.length > 0 && (
                  <div className="text-center">
                    <Button 
                      variant="outline" 
                      onClick={addUploadSet}
                      size="lg"
                      className="btn-secondary-gradient"
                    >
                      <Plus className="mr-2 h-5 w-5" />
                      Add Another Upload Set
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Footer with gradient background */}
            <div className="bg-gradient-to-r from-muted/50 to-muted/30 p-6 border-t">
              <DialogFooter className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {totalFiles > 0 && (
                    <span>Total files: <span className="font-semibold text-primary">{totalFiles}</span></span>
                  )}
                </div>
                <div className="flex gap-3">
                  <DialogClose asChild>
                    <Button type="button" variant="outline" className="btn-secondary-gradient">
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
                </div>
              </DialogFooter>
            </div>
          </div>
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