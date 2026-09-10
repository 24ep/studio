import { Checkbox } from "@/components/ui/checkbox";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { CustomFieldFormTabProps } from "./CustomFieldDrawerFormTabTypes";

export type VisibilityFieldName =
  | "showInFilter"
  | "showInApplicantDetail"
  | "showInFullApplicantDetail"
  | "showInTaskBoardFilter"
  | "showInPositionSettings"
  | "showInHeadcountDetail";

export function VisibilityCheckbox({
  form,
  name,
  label,
  description,
}: CustomFieldFormTabProps & {
  name: VisibilityFieldName;
  label: string;
  description: string;
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
          <FormControl>
            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
          </FormControl>
          <div className="space-y-1 leading-none">
            <FormLabel>{label}</FormLabel>
            <FormDescription>{description}</FormDescription>
          </div>
        </FormItem>
      )}
    />
  );
}

export function ApplicantDetailSectionField({ form }: CustomFieldFormTabProps) {
  return (
    <div className="space-y-3">
      <Separator />
      <div className="space-y-2">
        <Label className="text-sm font-medium">Display Section</Label>
        <FormField
          control={form.control}
          name="applicantDetailSection"
          render={({ field }) => (
            <FormItem>
              <Select value={field.value || ""} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select section to display in" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="jobs">Jobs Tab</SelectItem>
                  <SelectItem value="applicant-info">Applicant Info Tab</SelectItem>
                  <SelectItem value="education">Education Tab</SelectItem>
                  <SelectItem value="experience">Experience Tab</SelectItem>
                  <SelectItem value="job-suitability">Job Suitability Tab</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>Choose which tab section to display this field in</FormDescription>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

export function PositionDetailSectionField({ form }: CustomFieldFormTabProps) {
  return (
    <div className="space-y-3">
      <Separator />
      <div className="space-y-2">
        <Label className="text-sm font-medium">Display Section</Label>
        <FormField
          control={form.control}
          name="positionDetailSection"
          render={({ field }) => (
            <FormItem>
              <Select value={field.value || ""} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select section to display in" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="details">Details Tab</SelectItem>
                  <SelectItem value="criteria">Match Criteria Tab</SelectItem>
                  <SelectItem value="applicants">Applicants Tab</SelectItem>
                  <SelectItem value="headcount">Headcount Tab</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>Choose which tab section to display this field in</FormDescription>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
