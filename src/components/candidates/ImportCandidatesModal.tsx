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
import { toast } from 'react-hot-toast';
import { FileUp, Loader2, Users } from 'lucide-react';
import type { Candidate } from '@/lib/types';
import { useCandidateQueue } from "@/components/candidates/CandidateImportUploadQueue";

interface ImportCandidatesModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onImportSuccess: () => void;
}

const ACCEPTED_EXCEL_TYPES = [
  '.xlsx',
  '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel'
].join(',');


export function ImportCandidatesModal({ isOpen, onOpenChange, onImportSuccess }: ImportCandidatesModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const { addJob, updateJob } = useCandidateQueue();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const fileType = file.type;
      const fileName = file.name.toLowerCase();
      const acceptedMimeTypes = ACCEPTED_EXCEL_TYPES.split(',');
      
      if (acceptedMimeTypes.includes(fileType) || fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        setSelectedFile(file);
      } else {
        toast.error("Please select an Excel file (.xlsx, .xls).");
        setSelectedFile(null);
        event.target.value = '';
      }
    } else {
      setSelectedFile(null);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error("Please select an Excel file to import.");
      return;
    }
    setIsImporting(true);
    const jobId = `${selectedFile.name}-${selectedFile.size}-${Date.now()}-${Math.random()}`;
    addJob({
      id: jobId,
      file: selectedFile,
      type: "import",
      status: "importing"
    });
    const formData = new FormData();
    formData.append('file', selectedFile);
    try {
      const response = await fetch('/api/candidates/import', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      if (!response.ok) {
        updateJob(jobId, { status: "error", error: result.message || `Failed to import candidates. Status: ${response.status}`, errorDetails: JSON.stringify(result) });
        throw new Error(result.message || `Failed to import candidates. Status: ${response.status}`);
      }
      updateJob(jobId, { status: "success" });
      toast.success("Import process completed.");
      onImportSuccess();
      onOpenChange(false);
      setSelectedFile(null);
      const fileInput = document.getElementById('candidate-excel-import') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error) {
      updateJob(jobId, { status: "error", error: (error as Error).message, errorDetails: (error as Error).stack });
      console.error("Error importing candidates:", error);
      toast.error((error as Error).message || "An unexpected error occurred during import.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) {
        setSelectedFile(null);
        setIsImporting(false);
        const fileInput = document.getElementById('candidate-excel-import') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5 text-primary" /> Import Candidates (Excel)
          </DialogTitle>
          <DialogDescription>
            Upload an Excel file (.xlsx, .xls) containing candidate data.
            Refer to the downloaded Excel template guide for the expected structure.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-2">
          <Label htmlFor="candidate-excel-import">Select Excel File</Label>
          <Input
            id="candidate-excel-import"
            type="file"
            accept={ACCEPTED_EXCEL_TYPES}
            onChange={handleFileChange}
            className="mt-1"
          />
          {selectedFile && <p className="text-sm text-muted-foreground mt-1">Selected: {selectedFile.name}</p>}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleImport} disabled={!selectedFile || isImporting}>
            {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4" />}
            {isImporting ? 'Importing...' : 'Upload & Import'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    