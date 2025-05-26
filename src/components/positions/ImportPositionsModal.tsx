
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
import { FileUp, Loader2, Briefcase } from 'lucide-react';

interface ImportPositionsModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onImportSuccess: () => void; 
}

export function ImportPositionsModal({ isOpen, onOpenChange, onImportSuccess }: ImportPositionsModalProps) {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'application/json') {
        setSelectedFile(file);
      } else {
        toast({ title: "Invalid File Type", description: "Please select a JSON file (.json).", variant: "destructive" });
        setSelectedFile(null);
        event.target.value = '';
      }
    } else {
      setSelectedFile(null);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast({ title: "No File Selected", description: "Please select a JSON file to import.", variant: "destructive" });
      return;
    }
    setIsImporting(true);
    try {
      const fileContent = await selectedFile.text();
      const positionsToImport = JSON.parse(fileContent);

      const response = await fetch('/api/positions/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(positionsToImport),
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


      toast({ title: "Import Complete", description: successMessage});
      onImportSuccess();
      onOpenChange(false);
      setSelectedFile(null);
      const fileInput = document.getElementById('position-json-import') as HTMLInputElement;
      if (fileInput) fileInput.value = '';


    } catch (error) {
      console.error("Error importing positions:", error);
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
        const fileInput = document.getElementById('position-json-import') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Briefcase className="mr-2 h-5 w-5 text-primary" /> Import Positions (JSON)
          </DialogTitle>
          <DialogDescription>
            Upload a JSON file containing an array of position objects. 
            Required fields: title, department, isOpen. Optional: description, position_level.
            (Excel support is planned for a future update).
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-2">
          <Label htmlFor="position-json-import">Select JSON File</Label>
          <Input
            id="position-json-import"
            type="file"
            accept=".json,application/json"
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
