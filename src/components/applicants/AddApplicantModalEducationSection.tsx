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
import { createEducationDefaults } from "./add-applicant-modal-form";
import type { AddApplicantModalController } from "./use-add-applicant-modal";

interface AddApplicantEducationSectionProps {
  controller: AddApplicantModalController;
}

export function AddApplicantEducationSection({ controller }: AddApplicantEducationSectionProps) {
  const { education, form } = controller;

  return (
    <fieldset className="space-y-3 border p-4 rounded-md">
      <legend className="text-lg font-semibold">Education</legend>
      {education.fields.map((field, index) => (
        <div key={field.id} className="p-3 border rounded-md space-y-2 bg-muted/30 relative">
          <Input placeholder="University" {...form.register(`education.${index}.university`)} />
          <Input placeholder="Major" {...form.register(`education.${index}.major`)} />
          <Input placeholder="Field of Study" {...form.register(`education.${index}.field`)} />
          <Input placeholder="Campus" {...form.register(`education.${index}.campus`)} />

          <MonthYearInputs
            monthLabel="Start Month"
            yearLabel="Start Year"
            monthValue={form.watch(`education.${index}.startMonth`)?.toString() || ""}
            onMonthChange={(value) => form.setValue(`education.${index}.startMonth`, parseInt(value))}
            yearRegister={form.register(`education.${index}.startYear`, { valueAsNumber: true })}
            selectId="add-applicant-start-month-select"
          />

          <div className="flex items-center space-x-2">
            <Controller
              name={`education.${index}.isCurrent`}
              control={form.control}
              render={({ field: controllerField }) => (
                <Checkbox
                  checked={controllerField.value}
                  onCheckedChange={controllerField.onChange}
                />
              )}
            />
            <Label>Currently studying</Label>
          </div>

          {!form.watch(`education.${index}.isCurrent`) && (
            <MonthYearInputs
              monthLabel="End Month"
              yearLabel="End Year"
              monthValue={form.watch(`education.${index}.endMonth`)?.toString() || ""}
              onMonthChange={(value) => form.setValue(`education.${index}.endMonth`, parseInt(value))}
              yearRegister={form.register(`education.${index}.endYear`, { valueAsNumber: true })}
              selectId="add-applicant-end-month-select"
            />
          )}

          <Input placeholder="GPA" {...form.register(`education.${index}.GPA`)} />
          <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 h-7 w-7" onClick={() => education.remove(index)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" onClick={() => education.append(createEducationDefaults())}>
        <PlusCircle className="mr-2 h-4 w-4" />
        Add Education
      </Button>
    </fieldset>
  );
}

export function MonthYearInputs({
  monthLabel,
  monthValue,
  onMonthChange,
  selectId,
  yearLabel,
  yearRegister,
}: {
  monthLabel: string;
  monthValue: string;
  onMonthChange: (value: string) => void;
  selectId: string;
  yearLabel: string;
  yearRegister: Record<string, unknown>;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <div>
        <Label className="text-xs">{monthLabel}</Label>
        <Select value={monthValue} onValueChange={onMonthChange}>
          <SelectTrigger>
            <SelectValue placeholder="Month" />
          </SelectTrigger>
          <SelectContent selectId={selectId}>
            {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => (
              <SelectItem key={month} value={month.toString()}>
                {new Date(2000, month - 1).toLocaleDateString("en-US", { month: "long" })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">{yearLabel}</Label>
        <Input
          type="number"
          min="1900"
          max="2100"
          placeholder="Year"
          {...yearRegister}
        />
      </div>
    </div>
  );
}
