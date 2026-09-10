import { PlusCircleIcon as PlusCircle, TrashIcon as Trash2 } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createSkillDefaults } from "./add-applicant-modal-form";
import type { AddApplicantModalController } from "./use-add-applicant-modal";

interface AddApplicantSkillsSectionProps {
  controller: AddApplicantModalController;
}

export function AddApplicantSkillsSection({ controller }: AddApplicantSkillsSectionProps) {
  const { form, skills } = controller;

  return (
    <fieldset className="space-y-3 border p-4 rounded-md">
      <legend className="text-lg font-semibold">Skills</legend>
      {skills.fields.map((field, index) => (
        <div key={field.id} className="p-3 border rounded-md space-y-2 relative bg-muted/30">
          <Input placeholder="Skill Segment (e.g., Programming Languages, Software)" {...form.register(`skills.${index}.segment_skill`)} />
          <Textarea placeholder="Skills (comma-separated, e.g., Excel, Photoshop, Python)" {...form.register(`skills.${index}.skill_string`)} />
          {skills.fields.length > 1 && (
            <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 h-7 w-7" onClick={() => skills.remove(index)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
      ))}
      <Button type="button" variant="outline" onClick={() => skills.append(createSkillDefaults())}>
        <PlusCircle className="mr-2 h-4 w-4" />
        Add Skill Segment
      </Button>
    </fieldset>
  );
}
