"use client";

import { UsersIcon as Users } from "@heroicons/react/24/outline";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import type { MobileApplicantActionDialogsProps } from "./MobileApplicantActionDialogsTypes";

type MobileApplicantRecruiterDialogProps = Pick<
  MobileApplicantActionDialogsProps,
  | "isRecruiterModalOpen"
  | "onRecruiterModalOpenChange"
  | "availableRecruiters"
  | "newRecruiterId"
  | "onNewRecruiterIdChange"
  | "onAssignRecruiter"
>;

export function MobileApplicantRecruiterDialog({
  isRecruiterModalOpen,
  onRecruiterModalOpenChange,
  availableRecruiters,
  newRecruiterId,
  onNewRecruiterIdChange,
  onAssignRecruiter,
}: MobileApplicantRecruiterDialogProps) {
  return (
    <Dialog open={isRecruiterModalOpen} onOpenChange={onRecruiterModalOpenChange}>
      <DialogContent
        className="fixed bottom-0 left-1/2 top-auto translate-x-[-50%] translate-y-0 w-screen max-w-none h-auto p-0 overflow-hidden rounded-t-3xl rounded-b-none border-0 shadow-2xl bg-background flex flex-col"
        dialogId="recruiter-actions-modal"
      >
        <VisuallyHidden>
          <DialogTitle>Assign Recruiter</DialogTitle>
        </VisuallyHidden>

        <DialogHeader className="border-b px-4 pt-6 pb-4 flex-shrink-0">
          <div className="text-lg font-semibold text-center">Assign Recruiter</div>
        </DialogHeader>

        <div className="p-4 space-y-2 max-h-[70vh] overflow-y-auto">
          {availableRecruiters.length > 0 ? (
            availableRecruiters.map((recruiter) => (
              <Button
                key={recruiter.id}
                variant={newRecruiterId === recruiter.id ? "default" : "outline"}
                onClick={() => onNewRecruiterIdChange(recruiter.id)}
                className="w-full justify-between h-auto py-3 px-4"
              >
                <span>{recruiter.name}</span>
                {newRecruiterId === recruiter.id && <Users className="h-4 w-4" />}
              </Button>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-4">No recruiters available.</p>
          )}
        </div>

        <div className="border-t px-4 py-4">
          <Button disabled={!newRecruiterId} onClick={onAssignRecruiter}>
            Assign
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
