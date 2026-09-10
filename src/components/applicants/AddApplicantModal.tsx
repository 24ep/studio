"use client";

import {
  UserPlusIcon as UserPlus,
} from "@heroicons/react/24/outline";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AddApplicantModalForm } from "./AddApplicantModalForm";
import type { AddApplicantModalProps } from "./AddApplicantModalTypes";
import { useAddApplicantModal } from "./use-add-applicant-modal";

export function AddApplicantModal(props: AddApplicantModalProps) {
  const { isOpen, onOpenChange } = props;
  const controller = useAddApplicantModal(props);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden" dialogId="add-applicant-modal">
        <DialogHeader className="p-6 pb-0 flex-shrink-0">
          <DialogTitle className="flex items-center">
            <UserPlus className="mr-2 h-6 w-6 text-primary" />
            Add New Applicant
          </DialogTitle>
          <DialogDescription>
            Enter the details for the new Applicant. Fields marked with * are required.
          </DialogDescription>
        </DialogHeader>
        <AddApplicantModalForm controller={controller} />
      </DialogContent>
    </Dialog>
  );
}
