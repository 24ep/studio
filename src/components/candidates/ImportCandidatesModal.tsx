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
import { FileUp, Loader2, Users } from 'lucide-react';
import type { Candidate } from '@/lib/types';

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
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const fileType = file.type;
      const fileName = file.name.toLowerCase();
      const acceptedMimeTypes = ACCEPTED_EXCEL_TYPES.split(',');
      
      if (acceptedMimeTypes.includes(fileType) || fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        setSelectedFile(file);
      } else {
        toast({ title: "Invalid File Type", description: "Please select an Excel file (.xlsx, .xls).", variant: "destructive" });
        setSelectedFile(null);
        event.target.value = '';
      }
    } else {
      setSelectedFile(null);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast({ title: "No File Selected", description: "Please select an Excel file to import.", variant: "destructive" });
      return;
    }
    setIsImporting(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('/api/candidates/import', {
        method: 'POST',
        body: formData, // Send as FormData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `Failed to import candidates. Status: ${response.status}`);
      }

      let successMessage = `Import process completed.`;
      if (result.successfulImports !== undefined && result.failedImports !== undefined) {
        successMessage += ` ${result.successfulImports} candidates imported successfully. ${result.failedImports} failed.`;
        if (result.errors && result.errors.length > 0) {
          console.error("Import errors:", result.errors);
          successMessage += " Check console for details on failures."
        }
      }

      toast({ title: "Import Complete", description: successMessage });
      onImportSuccess();
      onOpenChange(false);
      setSelectedFile(null);
      const fileInput = document.getElementById('candidate-excel-import') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error) {
      console.error("Error importing candidates:", error);
      toast({
        title: "Import Failed",
        description: (error as Error).message || "An unexpected error occurred during import.",
        variant: "destructive",
      });
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

    