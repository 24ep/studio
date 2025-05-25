
"use client";

import { useState, type ChangeEvent } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, FileText, XCircle, Loader2, Zap } from 'lucide-react';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface CreateCandidateViaN8nModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onProcessingStart: () => void; // Callback when processing starts
}

export function CreateCandidateViaN8nModal({ isOpen, onOpenChange, onProcessingStart }: CreateCandidateViaN8nModalProps) {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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
    const fileInput = document.getElementById('n8n-candidate-pdf-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleUploadToN8n = async () => {
    if (!selectedFile) {
      toast({ title: "No PDF Selected", description: "Please select a PDF file to upload.", variant: "destructive" });
      return;
    }
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append('pdfFile', selectedFile);

    try {
      const response = await fetch('/api/candidates/upload-for-n8n', { // New API endpoint
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `Failed to send PDF to n8n for candidate creation. Status: ${response.status}`);
      }

      toast({
        title: "Resume Sent for Processing",
        description: result.message || `Resume "${selectedFile.name}" sent to n8n. A new candidate will be created if parsing is successful.`,
      });
      onProcessingStart(); // Notify parent page
      onOpenChange(false); // Close modal
      removeFile(); 
    } catch (error) {
      console.error("Error sending PDF to n8n for candidate creation:", error);
      toast({
        title: "Upload Failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  // Reset file when modal is closed or opened
  useState(() => {
    if (!isOpen) {
        removeFile();
    }
  });


  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) removeFile(); // Clear file on close
    }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Zap className="mr-2 h-5 w-5 text-orange-500" /> Create Candidate via Resume (n8n)
          </DialogTitle>
          <DialogDescription>
            Upload a PDF resume. It will be sent to an n8n workflow for parsing and candidate creation.
            The n8n workflow must be configured to POST back to `/api/candidates` to create the user.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
            <div>
                <Label htmlFor="n8n-candidate-pdf-upload">Select PDF Resume (Max 10MB)</Label>
                <Input
                id="n8n-candidate-pdf-upload"
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
        </div>
        
        <DialogFooter className="mt-2">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button 
              onClick={handleUploadToN8n} 
              disabled={!selectedFile || isUploading}
            >
              {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
              {isUploading ? 'Sending...' : 'Send to n8n for Creation'}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
