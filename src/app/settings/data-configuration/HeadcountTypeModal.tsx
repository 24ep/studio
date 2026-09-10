"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ColorPicker } from "@/components/ui/color-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { HeadcountTypeOption } from "./headcount-types-tab-types";

interface HeadcountTypeModalProps {
  option: HeadcountTypeOption;
  existingValues: string[];
  onSave: (option: HeadcountTypeOption) => void;
  onCancel: () => void;
}

export function HeadcountTypeModal({
  option,
  existingValues,
  onSave,
  onCancel,
}: HeadcountTypeModalProps) {
  const [formData, setFormData] = useState(option);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isEditing = Boolean(option.value);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const newErrors: Record<string, string> = {};

    if (!formData.value.trim()) {
      newErrors.value = "Value is required";
    } else if (existingValues.includes(formData.value) && formData.value !== option.value) {
      newErrors.value = "Value must be unique";
    }

    if (!formData.label.trim()) {
      newErrors.label = "Label is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave(formData);
  };

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="max-w-md" dialogId="headcount-types-modal">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Headcount Type" : "Add Headcount Type"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the headcount type configuration"
              : "Create a new headcount type with custom settings"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="value">Value *</Label>
            <Input
              id="value"
              value={formData.value}
              onChange={(event) => setFormData((previous) => ({ ...previous, value: event.target.value }))}
              placeholder="e.g., promote, new, replace"
              className={errors.value ? "border-red-500" : ""}
            />
            {errors.value && <p className="text-sm text-red-500 mt-1">{errors.value}</p>}
          </div>

          <div>
            <Label htmlFor="label">Label *</Label>
            <Input
              id="label"
              value={formData.label}
              onChange={(event) => setFormData((previous) => ({ ...previous, label: event.target.value }))}
              placeholder="e.g., Promote, New, Replace"
              className={errors.label ? "border-red-500" : ""}
            />
            {errors.label && <p className="text-sm text-red-500 mt-1">{errors.label}</p>}
          </div>

          <div>
            <Label>Color</Label>
            <ColorPicker
              value={formData.color}
              onChange={(color) => setFormData((previous) => ({ ...previous, color }))}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="submit">
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
