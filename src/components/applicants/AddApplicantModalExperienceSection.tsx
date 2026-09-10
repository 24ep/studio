import { PlusCircleIcon as PlusCircle, TrashIcon as Trash2 } from "@heroicons/react/24/outline";
import { Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createExperienceDefaults,
  PLACEHOLDER_VALUE_NONE,
} from "./add-applicant-modal-form";
import { MonthYearInputs } from "./AddApplicantModalEducationSection";
import type { AddApplicantModalController } from "./use-add-applicant-modal";

interface AddApplicantExperienceSectionProps {
  controller: AddApplicantModalController;
}

export function AddApplicantExperienceSection({ controller }: AddApplicantExperienceSectionProps) {
  const { experience, form, positionLevels } = controller;

  return (
    <fieldset className="space-y-3 border p-4 rounded-md">
      <legend className="text-lg font-semibold">Experience</legend>
      {experience.fields.map((field, index) => (
        <div key={field.id} className="p-3 border rounded-md space-y-2 relative bg-muted/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input placeholder="Company" {...form.register(`experience.${index}.company`)} />
            <Input placeholder="Position" {...form.register(`experience.${index}.position`)} />
            <Controller
              name={`experience.${index}.positionLevel`}
              control={form.control}
              render={({ field: controllerField }) => (
                <Select
                  onValueChange={(value) => controllerField.onChange(value === PLACEHOLDER_VALUE_NONE ? null : value)}
                  value={controllerField.value ?? PLACEHOLDER_VALUE_NONE}
                >
                  <SelectTrigger id={`experience.${index}.positionLevel`}>
                    <SelectValue placeholder="Position Level" />
                  </SelectTrigger>
                  <SelectContent selectId="add-applicant-position-level-select">
                    <SelectItem value={PLACEHOLDER_VALUE_NONE}>N/A / Not Specified</SelectItem>
                    {positionLevels.map((level) => (
                      <SelectItem key={level.id} value={level.name}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: level.color || "#6B7280" }}
                          />
                          {level.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <MonthYearInputs
            monthLabel="Start Month"
            yearLabel="Start Year"
            monthValue={form.watch(`experience.${index}.startMonth`)?.toString() || ""}
            onMonthChange={(value) => form.setValue(`experience.${index}.startMonth`, parseInt(value))}
            yearRegister={form.register(`experience.${index}.startYear`, { valueAsNumber: true })}
            selectId="add-applicant-education-start-month-select"
          />

          <div className="flex items-center space-x-2">
            <Controller
              name={`experience.${index}.isCurrent`}
              control={form.control}
              render={({ field: controllerField }) => (
                <Checkbox
                  checked={controllerField.value}
                  onCheckedChange={controllerField.onChange}
                />
              )}
            />
            <Label>Currently working</Label>
          </div>

          {!form.watch(`experience.${index}.isCurrent`) && (
            <MonthYearInputs
              monthLabel="End Month"
              yearLabel="End Year"
              monthValue={form.watch(`experience.${index}.endMonth`)?.toString() || ""}
              onMonthChange={(value) => form.setValue(`experience.${index}.endMonth`, parseInt(value))}
              yearRegister={form.register(`experience.${index}.endYear`, { valueAsNumber: true })}
              selectId="add-applicant-education-end-month-select"
            />
          )}

          <div>
            <Label className="text-xs">Description</Label>
            <Textarea
              {...form.register(`experience.${index}.description`)}
              placeholder="Describe your role and responsibilities..."
              className="mt-1 min-h-[80px]"
            />
          </div>
          <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 h-7 w-7" onClick={() => experience.remove(index)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" onClick={() => experience.append(createExperienceDefaults())}>
        <PlusCircle className="mr-2 h-4 w-4" />
        Add Experience
      </Button>
    </fieldset>
  );
}
