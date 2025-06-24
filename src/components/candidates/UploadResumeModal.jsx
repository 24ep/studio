"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ResumeUploadForm } from '@/components/upload/ResumeUploadForm';
import { UploadCloud } from 'lucide-react';
import { useEffect } from 'react'; // Added useEffect
export function UploadResumeModal({ isOpen, onOpenChange, candidate, onUploadSuccess }) {
    // Added for debugging auto-save
    useEffect(() => {
        if (isOpen) {
            // console.log("UploadResumeModal: Modal opened for candidate:", candidate?.name);
        }
    }, [isOpen, candidate]);
    if (!candidate)
        return null;
    const handleInternalUploadSuccess = (updatedCandidate) => {
        onUploadSuccess(updatedCandidate);
        onOpenChange(false);
    };
    return (<Dialog open={isOpen} onOpenChange={(open) => {
            // console.log("UploadResumeModal: Dialog onOpenChange called with:", open); // Added for debugging auto-save
            onOpenChange(open);
        }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <UploadCloud className="mr-2 h-5 w-5 text-primary"/>
            Upload Resume for {candidate.name}
          </DialogTitle>
          <DialogDescription>
            Select a PDF, DOC, or DOCX file to upload for this candidate.
            {candidate.resumePath && <div className="text-xs mt-1">Current resume: <span className="font-medium">{candidate.resumePath.split('-').pop()}</span></div>}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <ResumeUploadForm candidateId={candidate.id} onUploadSuccess={handleInternalUploadSuccess} currentResumePath={candidate.resumePath} cardMode={false}/>
        </div>
        
        <DialogFooter className="mt-2">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>);
}
