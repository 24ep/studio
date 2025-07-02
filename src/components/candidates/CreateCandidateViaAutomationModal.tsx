"use client";

import { useState, type ChangeEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'react-hot-toast';
import { UploadCloud, FileText, XCircle, Loader2, Zap } from 'lucide-react';
import type { Position } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const NONE_POSITION_VALUE = "___NONE_POSITION___"; // Placeholder for SelectItem value

interface CreateCandidateViaAutomationModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onProcessingStart: () => void; // Callback when processing starts
}

export function CreateCandidateViaAutomationModal({ isOpen, onOpenChange, onProcessingStart }: CreateCandidateViaAutomationModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [availablePositions, setAvailablePositions] = useState<Position[]>([]);
  const [selectedPositionId, setSelectedPositionId] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      const fetchPositions = async () => {
        try {
          const response = await fetch('/api/positions?isOpen=true'); // Fetch only open positions
          if (!response.ok) {
            throw new Error('Failed to fetch positions');
          }
          const result = await response.json();
          const data = Array.isArray(result) ? result : (result.data || []);
          setAvailablePositions(Array.isArray(data) ? data : []);
        } catch (error) {
          console.error("Error fetching positions for modal:", error);
          toast.error("Could not load positions for selection.");
        }
      };
      fetchPositions();
    } else {
      setSelectedFiles([]);
      setSelectedPositionId("");
      const fileInput = document.getElementById('automated-candidate-pdf-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }
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
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };
  const removeFile = (file: File) => {
    setSelectedFiles(prev => prev.filter(f => f !== file));
  };

  const handleUploadForProcessing = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Please select at least one PDF file to upload.");
      return;
    }
    setIsUploading(true);
    try {
      await Promise.all(selectedFiles.map(async (file) => {
        const formData = new FormData();
        formData.append('pdfFile', file);
        if (selectedPositionId && selectedPositionId !== NONE_POSITION_VALUE) {
          formData.append('positionId', selectedPositionId);
          const selectedPosition = availablePositions.find(p => p.id === selectedPositionId);
          if (selectedPosition) {
            if (selectedPosition.description) {
              formData.append('targetPositionDescription', selectedPosition.description);
            }
            if (selectedPosition.position_level) {
              formData.append('targetPositionLevel', selectedPosition.position_level);
            }
          }
        }
        try {
          const response = await fetch('/api/candidates/upload-for-automation', {
            method: 'POST',
            body: formData,
          });
          const result = await response.json();
          if (!response.ok) {
            let description = result.message || `Failed to send PDF for automated candidate creation. Status: ${response.status}`;
            if (response.status === 500 && typeof result.errorDetails === 'string') {
              try {
                const parsedAutomationError = JSON.parse(result.errorDetails);
                if (parsedAutomationError.message === "No item to return got found") {
                  description = "The automation workflow reported: 'No item to return got found'. This means the workflow ran but didn't produce the expected candidate data. Please check the automation workflow configuration and execution logs.";
                } else if (parsedAutomationError.message === "Error in workflow") {
                  description = "The automation workflow reported a general error: 'Error in workflow'. This indicates an issue within the automation workflow itself. Please check the automation execution logs for more specific details about what went wrong during its processing.";
                } else {
                  const detailsSnippet = String(result.errorDetails).substring(0, 150) + (String(result.errorDetails).length > 150 ? '...' : '');
                  description = `The automation workflow encountered an internal server error (500). Please check your automation workflow logs for details. Automation Output: ${detailsSnippet}`;
                }
              } catch (e) {
                const detailsSnippet = String(result.errorDetails).substring(0, 150) + (String(result.errorDetails).length > 150 ? '...' : '');
                description = `The automation workflow encountered an internal server error (500) with non-JSON output. Please check your automation workflow logs. Output Snippet: ${detailsSnippet}`;
              }
            } else if (result.message === "automation integration for candidate creation is not configured on the server.") {
              description = "Automated candidate creation is not configured on the server. Please ensure the Generic PDF Webhook URL environment variable is set.";
            } else if (result.errorDetails) {
              const detailsSnippet = String(result.errorDetails).substring(0, 150) + (String(result.errorDetails).length > 150 ? '...' : '');
              description = `${result.message || 'Failed to send PDF.'} Details: ${detailsSnippet}`;
            }
            throw new Error(description);
          }
          toast.success(result.message || `Resume "${file.name}" sent for automated processing. A new candidate will be created if parsing is successful.`);
        } catch (error) {
          console.error("Error sending PDF for automated candidate creation:", error);
          toast.error((error as Error).message);
        }
      }));
      setSelectedFiles([]);
      setSelectedPositionId("");
      onProcessingStart();
      onOpenChange(false);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Zap className="mr-2 h-5 w-5 text-orange-500" /> Create Candidate via Resume (Automated)
          </DialogTitle>
          <DialogDescription>
            Upload one or more PDF resumes. Each will be sent for automated parsing and candidate creation. You can optionally select a position to associate the candidates with.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="position-select">Assign to Position (optional)</Label>
            <Select value={(selectedPositionId === "" ? NONE_POSITION_VALUE : selectedPositionId) || ''} onValueChange={value => setSelectedPositionId(value === NONE_POSITION_VALUE ? "" : value)}>
              <SelectTrigger id="position-select" className="mt-2">
                <SelectValue placeholder="Select a position..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_POSITION_VALUE}>None (General Application)</SelectItem>
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
            onClick={() => document.getElementById('automated-candidate-pdf-upload')?.click()}
            style={{ cursor: 'pointer' }}
          >
            <input
              id="automated-candidate-pdf-upload"
              type="file"
              accept="application/pdf"
              multiple
              className="hidden"
              onChange={handleInputChange}
            />
            <UploadCloud className="mx-auto mb-2 h-8 w-8 text-primary" />
            <p className="text-base font-medium mb-2">Drag and drop PDF files here, or click to select files</p>
            <p className="text-xs text-muted-foreground">Only PDF files are accepted. Max size: 500MB each.</p>
            {selectedFiles.length > 0 && (
              <div className="mt-4 flex flex-col gap-2">
                {selectedFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-background rounded px-2 py-1 border border-border">
                    <span className="truncate max-w-xs">{file.name}</span>
                    <Button type="button" size="icon" variant="ghost" onClick={e => { e.stopPropagation(); removeFile(file); }}>
                      <XCircle className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isUploading}>Cancel</Button>
          </DialogClose>
          <Button onClick={handleUploadForProcessing} disabled={selectedFiles.length === 0 || isUploading}>
            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
            {isUploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

