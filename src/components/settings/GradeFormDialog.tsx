"use client";

import type { FormEvent } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ColorPicker } from "@/components/ui/color-picker";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { Grade } from "@/lib/types";

import type { GradeFormData } from "./GradesTabTypes";

interface GradeFormDialogProps {
  editingGrade: Grade | null;
  formData: GradeFormData;
  isOpen: boolean;
  isSubmitting: boolean;
  onFormDataChange: (data: GradeFormData) => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
}

export function GradeFormDialog({
  editingGrade,
  formData,
  isOpen,
  isSubmitting,
  onFormDataChange,
  onOpenChange,
  onSubmit,
}: GradeFormDialogProps) {
  const updateFormData = (updates: Partial<GradeFormData>) => {
    onFormDataChange({ ...formData, ...updates });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingGrade ? "Edit Grade" : "Add New Grade"}
          </DialogTitle>
          <DialogDescription>
            Configure grade settings and SLA requirements.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Grade Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(event) => updateFormData({ name: event.target.value })}
              placeholder="e.g., Grade 8+"
              required
            />
          </div>
          <div>
            <Label htmlFor="label">Label</Label>
            <Input
              id="label"
              value={formData.label}
              onChange={(event) => updateFormData({ label: event.target.value })}
              placeholder="e.g., Senior"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(event) => updateFormData({ description: event.target.value })}
              placeholder="Describe the grade level or hiring SLA context"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="minLevel">Min Level *</Label>
              <Input
                id="minLevel"
                type="number"
                value={formData.minLevel}
                onChange={(event) => updateFormData({ minLevel: parseInt(event.target.value) })}
                min="1"
                required
              />
            </div>
            <div>
              <Label htmlFor="maxLevel">Max Level *</Label>
              <Input
                id="maxLevel"
                type="number"
                value={formData.maxLevel}
                onChange={(event) => updateFormData({ maxLevel: parseInt(event.target.value) })}
                min="1"
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="slaDays">SLA Days *</Label>
            <Input
              id="slaDays"
              type="number"
              value={formData.slaDays}
              onChange={(event) => updateFormData({ slaDays: parseInt(event.target.value) })}
              min="1"
              placeholder="e.g., 60"
              required
            />
          </div>
          <div>
            <Label htmlFor="color">Color</Label>
            <ColorPicker
              value={formData.color || "#3B82F6"}
              onChange={(color) => updateFormData({ color })}
              className="w-full"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => updateFormData({ isActive: checked })}
            />
            <Label htmlFor="isActive">Active</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingGrade ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
