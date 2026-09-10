import { Controller } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PositionSelectDropdown } from "@/components/applicants/PositionSelectDropdown";
import { formatScoreWithGrade, getScoreBgColor, getScoreColor } from "@/lib/scoreUtils";
import type { AddApplicantSectionProps } from "./AddApplicantModalSectionTypes";
import { ApplicantSourceOption } from './ApplicantSourceOption';

export function AddApplicantApplicationSection({ controller }: AddApplicantSectionProps) {
  const { availableSources, availableStages, form } = controller;
  const selectedSource = availableSources.find(source => source.id === form.watch("sourceId"));

  return (
    <fieldset className="space-y-3 border p-4 rounded-md">
      <legend className="text-lg font-semibold">Application Details</legend>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="positionId">Applying for Position *</Label>
          <Controller
            name="positionId"
            control={form.control}
            render={({ field }) => (
              <PositionSelectDropdown
                value={field.value || ""}
                onValueChange={field.onChange}
                placeholder="Select position..."
                showOpenStatus={true}
                filterOpenOnly={false}
              />
            )}
          />
          {form.formState.errors.positionId && (
            <p className="text-sm text-destructive mt-1">{form.formState.errors.positionId.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="status">Initial Status</Label>
          <Controller
            name="status"
            control={form.control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger id="status" className="mt-1">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent selectId="add-applicant-status-select">
                  {availableStages.map((stage) => (
                    <SelectItem key={stage.id} value={stage.id}>{stage.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {form.formState.errors.status && (
            <p className="text-sm text-destructive mt-1">{form.formState.errors.status.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="applicationDate">Application Date *</Label>
          <Input
            id="applicationDate"
            type="date"
            {...form.register("applicationDate", { required: true })}
            className="mt-1"
          />
          {form.formState.errors.applicationDate && (
            <p className="text-sm text-destructive mt-1">{form.formState.errors.applicationDate.message}</p>
          )}
        </div>
      </div>
      <div>
        <Label htmlFor="fitScore">Initial Fit Score (0-100)</Label>
        <Controller
          name="fitScore"
          control={form.control}
          render={({ field }) => (
            <div className="space-y-2">
              <Input
                id="fitScore"
                type="number"
                {...field}
                onChange={(event) => field.onChange(parseInt(event.target.value, 10) || 0)}
                className="mt-1"
              />
              {field.value > 0 && (
                <div className={`text-sm px-2 py-1 rounded ${getScoreBgColor(field.value)} ${getScoreColor(field.value)}`}>
                  Grade: {formatScoreWithGrade(field.value)}
                </div>
              )}
            </div>
          )}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="sourceId">Source</Label>
          <Controller
            name="sourceId"
            control={form.control}
            render={({ field }) => (
              <Select value={field.value || "none"} onValueChange={(value) => {
                field.onChange(value === "none" ? "" : value);
                form.setValue("subSource", "");
              }}>
                <SelectTrigger id="sourceId" className="mt-1"><SelectValue placeholder="Select source" /></SelectTrigger>
                <SelectContent selectId="add-applicant-source-select">
                  <SelectItem value="none">Not specified</SelectItem>
                  {availableSources.filter(source => source.isActive).map(source => (
                    <SelectItem key={source.id} value={source.id}><ApplicantSourceOption name={source.name} description={source.description} /></SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        {selectedSource?.allowSubSource && (
          <div>
            <Label htmlFor="subSource">Source detail</Label>
            <Input id="subSource" {...form.register("subSource")} className="mt-1" placeholder="Campaign, referrer, or channel" />
          </div>
        )}
      </div>
      <div>
        <Label htmlFor="assignmentJustification">Application Justification</Label>
        <textarea id="assignmentJustification" {...form.register("assignmentJustification")} className="mt-1 flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Add one reason per line" />
      </div>
      <div>
        <Label htmlFor="customAttributes">Custom Attributes (JSON)</Label>
        <textarea id="customAttributes" {...form.register("customAttributes")} className="mt-1 flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm" placeholder={'{"portfolioUrl":"https://example.com"}'} />
        {form.formState.errors.customAttributes && (
          <p className="text-sm text-destructive mt-1">{form.formState.errors.customAttributes.message}</p>
        )}
      </div>
    </fieldset>
  );
}
