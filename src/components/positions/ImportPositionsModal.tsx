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
import { FileUp, Loader2, Briefcase } from 'lucide-react';

interface ImportPositionsModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onImportSuccess: () => void; 
}

const ACCEPTED_FILE_TYPES = [
  '.xlsx',
  '.xls',
  '.csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv'
].join(',');

export function ImportPositionsModal({ isOpen, onOpenChange, onImportSuccess }: ImportPositionsModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const fileType = file.type;
      const fileName = file.name.toLowerCase();
      const acceptedMimeTypes = ACCEPTED_FILE_TYPES.split(',');
      
      if (acceptedMimeTypes.includes(fileType) || fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        setSelectedFile(file);
      } else {
        toast.error("Please select an Excel or CSV file (.xlsx, .xls, .csv).");
        setSelectedFile(null);
        event.target.value = '';
      }
    } else {
      setSelectedFile(null);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error("Please select an Excel or CSV file to import.");
      return;
    }
    setIsImporting(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('/api/positions/import', {
        method: 'POST',
        body: formData, // Send as FormData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `Failed to import positions. Status: ${response.status}`);
      }
      
      let successMessage = `Import process completed.`;
      if (result.successfulImports !== undefined && result.failedImports !== undefined) {
        successMessage += ` ${result.successfulImports} positions imported successfully. ${result.failedImports} failed.`;
         if (result.errors && result.errors.length > 0) {
          console.error("Import errors:", result.errors);
          successMessage += " Check console for details on failures."
        }
      }

      toast.success(successMessage);
      onImportSuccess();
      onOpenChange(false);
      setSelectedFile(null);
      const fileInput = document.getElementById('position-import-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error) {
      console.error("Error importing positions:", error);
      toast.error((error as Error).message || "An unexpected error occurred during import.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadCsvTemplate = () => {
    const headers = ["title", "department", "isOpen", "position_level"];
    const exampleRows = [
      ["Sample Position", "Engineering", "TRUE", "Senior"]
    ];
    let csvContent = headers.join(',') + '\n';
    exampleRows.forEach(row => {
      csvContent += row.map(val => `"${String(val || '').replace(/"/g, '""')}"`).join(',') + '\n';
    });
    csvContent += "\nNOTE: isOpen should be TRUE or FALSE. position_level is optional.";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'positions_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) {
        setSelectedFile(null);
        setIsImporting(false);
        const fileInput = document.getElementById('position-import-file') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Briefcase className="mr-2 h-5 w-5 text-primary" /> Import Positions (Excel/CSV)
          </DialogTitle>
          <DialogDescription>
            Upload an Excel or CSV file (.xlsx, .xls, .csv) containing position data.<br />
            <Button variant="link" className="p-0 h-auto text-primary underline" onClick={handleDownloadCsvTemplate}>
              Download CSV Template
            </Button>
            <br />Refer to the template for the expected structure.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-2">
          <Label htmlFor="position-import-file">Select Excel or CSV File</Label>
          <Input
            id="position-import-file"
            type="file"
            accept={ACCEPTED_FILE_TYPES}
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
