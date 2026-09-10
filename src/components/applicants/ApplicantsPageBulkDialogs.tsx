import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RecruiterAvatar } from '@/components/ui/recruiter-avatar';
import type { ApplicantsPageModalsProps } from './ApplicantsPageModalsTypes';
import {
  getSelectedApplicantIds,
  getSelectedApplicantsDescription,
} from './applicants-page-modals-utils';

type BulkStatusDialogProps = Pick<
  ApplicantsPageModalsProps,
  | 'isBulkStatusModalOpen'
  | 'setIsBulkStatusModalOpen'
  | 'bulkNewStatus'
  | 'setBulkNewStatus'
  | 'bulkTransitionNotes'
  | 'setBulkTransitionNotes'
  | 'selectedApplicantIds'
  | 'handleBulkChangeStatus'
  | 'availableStagesForBulk'
>;

type BulkRecruiterDialogProps = Pick<
  ApplicantsPageModalsProps,
  | 'isBulkRecruiterModalOpen'
  | 'setIsBulkRecruiterModalOpen'
  | 'bulkNewRecruiterId'
  | 'setBulkNewRecruiterId'
  | 'selectedApplicantIds'
  | 'handleBulkAssignRecruiter'
  | 'availableRecruiter'
>;

export function BulkStatusChangeDialog({
  isBulkStatusModalOpen,
  setIsBulkStatusModalOpen,
  bulkNewStatus,
  setBulkNewStatus,
  bulkTransitionNotes,
  setBulkTransitionNotes,
  selectedApplicantIds,
  handleBulkChangeStatus,
  availableStagesForBulk,
}: BulkStatusDialogProps) {
  const resetStatusDialog = () => {
    setIsBulkStatusModalOpen(false);
    setBulkNewStatus('');
    setBulkTransitionNotes('');
  };

  return (
    <AlertDialog open={isBulkStatusModalOpen} onOpenChange={setIsBulkStatusModalOpen}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Change Status for Selected Applicants</AlertDialogTitle>
          <AlertDialogDescription>
            {getSelectedApplicantsDescription(selectedApplicantIds.size, 'status')}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bulk-status">New Status</Label>
            <Select value={bulkNewStatus} onValueChange={setBulkNewStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {availableStagesForBulk.map((stage) => (
                  <SelectItem key={stage.id} value={stage.id}>
                    {stage.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Label htmlFor="bulk-notes">Transition Notes (Optional)</Label>
            <Textarea
              id="bulk-notes"
              placeholder="Add notes about this status change..."
              value={bulkTransitionNotes}
              onChange={(event) => setBulkTransitionNotes(event.target.value)}
              rows={3}
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={resetStatusDialog}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              if (!bulkNewStatus) return;

              handleBulkChangeStatus(
                getSelectedApplicantIds(selectedApplicantIds),
                bulkNewStatus,
                bulkTransitionNotes
              );
              resetStatusDialog();
            }}
            disabled={!bulkNewStatus}
          >
            Change Status
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function BulkRecruiterAssignmentDialog({
  isBulkRecruiterModalOpen,
  setIsBulkRecruiterModalOpen,
  bulkNewRecruiterId,
  setBulkNewRecruiterId,
  selectedApplicantIds,
  handleBulkAssignRecruiter,
  availableRecruiter,
}: BulkRecruiterDialogProps) {
  const resetRecruiterDialog = () => {
    setIsBulkRecruiterModalOpen(false);
    setBulkNewRecruiterId(null);
  };

  return (
    <AlertDialog open={isBulkRecruiterModalOpen} onOpenChange={setIsBulkRecruiterModalOpen}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Assign Recruiter to Selected Applicants</AlertDialogTitle>
          <AlertDialogDescription>
            {getSelectedApplicantsDescription(selectedApplicantIds.size, 'recruiter')}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bulk-recruiter">Recruiter</Label>
            <Select
              value={bulkNewRecruiterId || 'none'}
              onValueChange={(value) => setBulkNewRecruiterId(value === 'none' ? null : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select recruiter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Recruiter</SelectItem>
                {availableRecruiter.map((recruiter) => (
                  <SelectItem key={recruiter.id} value={recruiter.id}>
                    <span className="flex items-center gap-2.5"><RecruiterAvatar user={recruiter} size="xs" showBorder={false} /><span>{recruiter.name}</span></span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={resetRecruiterDialog}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              handleBulkAssignRecruiter(
                getSelectedApplicantIds(selectedApplicantIds),
                bulkNewRecruiterId
              );
              resetRecruiterDialog();
            }}
          >
            Assign Recruiter
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
