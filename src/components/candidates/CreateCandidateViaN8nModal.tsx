
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
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, FileText, XCircle, Loader2, Zap } from 'lucide-react';
import type { Position } from '@/lib/types';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const NONE_POSITION_VALUE = "___NONE_POSITION___"; // Placeholder for SelectItem value

interface CreateCandidateViaN8nModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onProcessingStart: () => void; // Callback when processing starts
}

export function CreateCandidateViaN8nModal({ isOpen, onOpenChange, onProcessingStart }: CreateCandidateViaN8nModalProps) {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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
          const data: Position[] = await response.json();
          setAvailablePositions(data);
        } catch (error) {
          console.error("Error fetching positions for modal:", error);
          toast({ title: "Error", description: "Could not load positions for selection.", variant: "destructive" });
        }
      };
      fetchPositions();
    } else {
      // Reset state when modal closes
      setSelectedFile(null);
      setSelectedPositionId("");
      const fileInput = document.getElementById('automated-candidate-pdf-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }
  }, [isOpen, toast]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'application/pdf') {
        if (file.size > MAX_FILE_SIZE) {
            toast({ title: "File Too Large", description: `PDF file size should not exceed ${MAX_FILE_SIZE / (1024*1024)}MB.`, variant: "destructive" });
            setSelectedFile(null);
            event.target.value = '';
            return;
        }
        setSelectedFile(file);
      } else {
        toast({ title: "Invalid File Type", description: "Please select a PDF file.", variant: "destructive" });
        setSelectedFile(null);
        event.target.value = '';
      }
    } else {
      setSelectedFile(null);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    const fileInput = document.getElementById('automated-candidate-pdf-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleUploadForProcessing = async () => {
    if (!selectedFile) {
      toast({ title: "No PDF Selected", description: "Please select a PDF file to upload.", variant: "destructive" });
      return;
    }
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append('pdfFile', selectedFile);

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
      const response = await fetch('/api/candidates/upload-for-n8n', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        let description = result.message || `Failed to send PDF for automated candidate creation. Status: ${response.status}`;
        if (result.message === "n8n integration for candidate creation is not configured on the server.") { 
          description = "Automated candidate creation is not configured on the server. Please ensure the Generic PDF Webhook URL environment variable is set.";
        }
        throw new Error(description);
      }

      toast({
        title: "Resume Sent for Processing",
        description: result.message || `Resume "${selectedFile.name}" sent for automated processing. A new candidate will be created if parsing is successful.`,
      });
      onProcessingStart();
      onOpenChange(false); // Close modal on success
    } catch (error) {
      console.error("Error sending PDF for automated candidate creation:", error);
      toast({
        title: "Upload Failed",
        description: (error as Error).message,
        variant: "destructive",
      });
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
            Upload a PDF resume. It will be sent for automated parsing and candidate creation.
            You can optionally select a position to associate the candidate with.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
            <div>
                <Label htmlFor="automated-candidate-pdf-upload">Select PDF Resume (Max 10MB)</Label>
                <Input
                id="automated-candidate-pdf-upload"
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="mt-1"
                />
            </div>
            {selectedFile && (
                <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md text-sm">
                <div className="flex items-center gap-2 truncate">
                    <FileText className="h-4 w-4 text-primary shrink-0" />
                    <span className="truncate">{selectedFile.name}</span> 
                    <span className="text-xs text-muted-foreground whitespace-nowrap">({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                </div>
                <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={removeFile}>
                    <XCircle className="h-4 w-4 text-destructive" />
                    <span className="sr-only">Remove file</span>
                </Button>
                </div>
            )}
             <div>
              <Label htmlFor="target-position-automated">Target Position (Optional)</Label>
              <Select 
                value={selectedPositionId || NONE_POSITION_VALUE} 
                onValueChange={(value) => setSelectedPositionId(value === NONE_POSITION_VALUE ? "" : value)}
              >
                <SelectTrigger id="target-position-automated" className="mt-1">
                  <SelectValue placeholder="Select a position to apply to..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_POSITION_VALUE}>None (General Application / Let system match)</SelectItem>
                  {availablePositions.map(pos => (
                    <SelectItem key={pos.id} value={pos.id}>{pos.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                If selected, this position will be prioritized. Its description will also be sent for processing.
              </p>
            </div>
        </div>
        
        <DialogFooter className="mt-2">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button 
              onClick={handleUploadForProcessing} 
              disabled={!selectedFile || isUploading}
            >
              {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
              {isUploading ? 'Sending...' : 'Send for Automated Creation'}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

