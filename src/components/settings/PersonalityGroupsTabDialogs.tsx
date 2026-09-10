"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ColorPicker } from "@/components/ui/color-picker";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import type {
  PersonalityGroupFormData,
  PersonalityTraitCreateFormData,
} from "./PersonalityGroupsTabTypes";

interface PersonalityGroupFormFieldsProps {
  formData: PersonalityGroupFormData;
  idPrefix: string;
  onChange: (formData: PersonalityGroupFormData) => void;
}

function PersonalityGroupFormFields({ formData, idPrefix, onChange }: PersonalityGroupFormFieldsProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor={`${idPrefix}-name`}>Name</Label>
        <Input
          id={`${idPrefix}-name`}
          value={formData.name}
          onChange={(event) => onChange({ ...formData, name: event.target.value })}
          placeholder={idPrefix === "create" ? "e.g., Communication Skills" : undefined}
        />
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-description`}>Description</Label>
        <Textarea
          id={`${idPrefix}-description`}
          value={formData.description}
          onChange={(event) => onChange({ ...formData, description: event.target.value })}
          placeholder={idPrefix === "create" ? "Optional description" : undefined}
        />
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-color`}>Color</Label>
        <ColorPicker
          value={formData.color || "#10B981"}
          onChange={(color) => onChange({ ...formData, color })}
          className="w-full"
        />
      </div>
    </div>
  );
}

interface PersonalityGroupDialogProps {
  open: boolean;
  mode: "create" | "edit";
  formData: PersonalityGroupFormData;
  onOpenChange: (open: boolean) => void;
  onFormDataChange: (formData: PersonalityGroupFormData) => void;
  onSubmit: () => void;
}

export function PersonalityGroupDialog({
  open,
  mode,
  formData,
  onOpenChange,
  onFormDataChange,
  onSubmit,
}: PersonalityGroupDialogProps) {
  const isCreate = mode === "create";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {isCreate && (
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Group
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isCreate ? "Create" : "Edit"} Personality Group</DialogTitle>
          <DialogDescription>
            {isCreate
              ? "Create a new group to organize related personality traits"
              : "Update the personality group details"}
          </DialogDescription>
        </DialogHeader>
        <PersonalityGroupFormFields
          formData={formData}
          idPrefix={mode}
          onChange={onFormDataChange}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit}>{isCreate ? "Create" : "Update"} Group</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface PersonalityAddTraitDialogProps {
  open: boolean;
  groupName?: string;
  formData: PersonalityTraitCreateFormData;
  onOpenChange: (open: boolean) => void;
  onFormDataChange: (formData: PersonalityTraitCreateFormData) => void;
  onSubmit: () => void;
}

export function PersonalityAddTraitDialog({
  open,
  groupName,
  formData,
  onOpenChange,
  onFormDataChange,
  onSubmit,
}: PersonalityAddTraitDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Trait to Group</DialogTitle>
          <DialogDescription>
            Add a new personality trait to the "{groupName}" group
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="trait-name">Trait Name</Label>
            <Input
              id="trait-name"
              value={formData.name}
              onChange={(event) => onFormDataChange({ ...formData, name: event.target.value })}
              placeholder="e.g., Leadership"
            />
          </div>
          <div>
            <Label htmlFor="trait-description">Description</Label>
            <Textarea
              id="trait-description"
              value={formData.description}
              onChange={(event) => onFormDataChange({ ...formData, description: event.target.value })}
              placeholder="Optional description"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit}>Add Trait</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
