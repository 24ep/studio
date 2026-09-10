import { ApplicantAvatar } from '@/components/ui/applicant-avatar';
import { Label } from '@/components/ui/label';
import type { Applicant } from '@/lib/types';

export function HeadcountApplicantAssignment({ selectedApplicant }: { selectedApplicant: Applicant | null }) {
  return (
    <div className="space-y-2">
      <Label>Applicant Assignment</Label>
      <div className="p-3 border rounded-lg bg-muted/50">
        {selectedApplicant ? (
          <div className="flex items-center gap-3">
            <ApplicantAvatar
              user={selectedApplicant}
              size="md"
              className="h-8 w-8"
            />
            <div className="flex-1">
              <div className="font-medium">{selectedApplicant.name}</div>
              <div className="text-sm text-muted-foreground">{selectedApplicant.email}</div>
            </div>
            <div className="text-xs text-muted-foreground">
              (Assignment managed via applicant details)
            </div>
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            <div className="text-sm">No applicant assigned</div>
            <div className="text-xs mt-1">Assign applicants through applicant details page</div>
          </div>
        )}
      </div>
    </div>
  );
}
