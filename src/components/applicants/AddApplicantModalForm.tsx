import { Button } from "@/components/ui/button";
import {
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import { AddApplicantApplicationSection } from "./AddApplicantModalBasicSections";
import { AddApplicantContactSection } from "./AddApplicantModalBasicSections";
import { AddApplicantEducationSection } from "./AddApplicantModalEducationSection";
import { AddApplicantExperienceSection } from "./AddApplicantModalExperienceSection";
import { AddApplicantPersonalSection } from "./AddApplicantModalBasicSections";
import { AddApplicantSkillsSection } from "./AddApplicantModalSkillsSection";
import type { AddApplicantModalController } from "./use-add-applicant-modal";

interface AddApplicantModalFormProps {
  controller: AddApplicantModalController;
}

export function AddApplicantModalForm({ controller }: AddApplicantModalFormProps) {
  const { form, onSubmit } = controller;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className="flex-1 min-h-0 overflow-y-auto px-6 pt-4 pb-6">
        <div className="space-y-6">
          <AddApplicantPersonalSection controller={controller} />
          <AddApplicantContactSection controller={controller} />
          <AddApplicantApplicationSection controller={controller} />
          <AddApplicantEducationSection controller={controller} />
          <AddApplicantExperienceSection controller={controller} />
          <AddApplicantSkillsSection controller={controller} />
        </div>
      </div>
      <DialogFooter className="p-6 pt-4 flex-shrink-0 bg-card border-t">
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </DialogClose>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Adding Applicant..." : "Add Applicant"}
        </Button>
      </DialogFooter>
    </form>
  );
}
