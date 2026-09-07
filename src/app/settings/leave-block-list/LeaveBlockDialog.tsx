"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface LeaveBlockForm {
  name: string;
  startDate: string;
  endDate: string;
  leaveType: string;
  scope: string;
  targetValue: string;
  reason: string;
  isActive: string;
}

export const emptyLeaveBlockForm: LeaveBlockForm = {
  name: "",
  startDate: "",
  endDate: "",
  leaveType: "all",
  scope: "all",
  targetValue: "",
  reason: "",
  isActive: "true",
};

interface LeaveBlockDialogProps {
  isEditing: boolean;
  form: LeaveBlockForm;
  onFormChange: React.Dispatch<React.SetStateAction<LeaveBlockForm>>;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => Promise<void>;
  open: boolean;
  saving: boolean;
}

export function LeaveBlockDialog({
  isEditing,
  form,
  onFormChange,
  onOpenChange,
  onSubmit,
  open,
  saving,
}: LeaveBlockDialogProps) {
  const update = (key: keyof LeaveBlockForm, value: string) => {
    onFormChange((current) => ({ ...current, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(92vw,680px)] max-w-[680px] rounded-[8px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit leave block" : "Add leave block"}</DialogTitle>
          <DialogDescription>
            Requests overlapping an active block are rejected for matching employees and leave types.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" className="sm:col-span-2">
            <Input
              value={form.name}
              onChange={(event) => update("name", event.target.value)}
              placeholder="Year-end payroll freeze"
            />
          </Field>
          <Field label="Start date">
            <Input
              type="date"
              value={form.startDate}
              onChange={(event) => update("startDate", event.target.value)}
            />
          </Field>
          <Field label="End date">
            <Input
              type="date"
              value={form.endDate}
              onChange={(event) => update("endDate", event.target.value)}
            />
          </Field>
          <Field label="Leave type">
            <Select value={form.leaveType} onChange={(value) => update("leaveType", value)}>
              <option value="all">All leave types</option>
              <option value="annual">Annual</option>
              <option value="sick">Sick</option>
              <option value="personal">Personal</option>
              <option value="maternity">Maternity</option>
              <option value="unpaid">Unpaid</option>
              <option value="other">Other</option>
            </Select>
          </Field>
          <Field label="Scope">
            <Select value={form.scope} onChange={(value) => update("scope", value)}>
              <option value="all">All employees</option>
              <option value="department">Department</option>
              <option value="location">Location</option>
            </Select>
          </Field>
          {form.scope !== "all" && (
            <Field
              label={form.scope === "department" ? "Department name or ID" : "Location"}
              className="sm:col-span-2"
            >
              <Input
                value={form.targetValue}
                onChange={(event) => update("targetValue", event.target.value)}
                placeholder={form.scope === "department" ? "Finance" : "Bangkok"}
              />
            </Field>
          )}
          <Field label="Status">
            <Select value={form.isActive} onChange={(value) => update("isActive", value)}>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </Select>
          </Field>
          <Field label="Reason" className="sm:col-span-2">
            <Textarea
              value={form.reason}
              onChange={(event) => update("reason", event.target.value)}
              rows={3}
              placeholder="Explain why leave is restricted during this period"
            />
          </Field>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={saving || !form.name || !form.startDate || !form.endDate}
            onClick={() => void onSubmit()}
          >
            {saving ? "Saving..." : isEditing ? "Update block" : "Create block"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  children,
  className,
  label,
}: {
  children: React.ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <div className={className}>
      <Label className="mb-2 block">{label}</Label>
      {children}
    </div>
  );
}

function Select({
  children,
  onChange,
  value,
}: {
  children: React.ReactNode;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-9 w-full rounded-[4px] border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
    >
      {children}
    </select>
  );
}
