import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  BriefcaseIcon as Briefcase,
  XMarkIcon as X,
} from '@heroicons/react/24/outline';
import type { ApplicantJobMatchModalData } from './full-applicant-detail-utils';

interface JobMatchModalHeaderProps {
  jobMatch: ApplicantJobMatchModalData;
  onClose: () => void;
}

export function JobMatchModalHeader({ jobMatch, onClose }: JobMatchModalHeaderProps) {
  return (
    <DialogHeader className="p-6 pb-4 border-b flex-shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            {jobMatch.position?.title || jobMatch.jobTitle}
          </DialogTitle>
          <DialogDescription className="mt-1">
            View job match details and compatibility information
          </DialogDescription>
        </div>
        <Button variant="ghost" size="icon" aria-label="Close job match details" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </DialogHeader>
  );
}
