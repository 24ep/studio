"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import type { PersonalityGroup, PersonalityTraitFormData } from "./PersonalityTraitsTabTypes";

interface PersonalityTraitFormFieldsProps {
  formData: PersonalityTraitFormData;
  groups: PersonalityGroup[];
  idPrefix: string;
  onFormDataChange: (formData: PersonalityTraitFormData) => void;
}

function PersonalityTraitFormFields({
  formData,
  groups,
  idPrefix,
  onFormDataChange,
}: PersonalityTraitFormFieldsProps) {
  const updateFormData = (updates: Partial<PersonalityTraitFormData>) => {
    onFormDataChange({ ...formData, ...updates });
  };

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor={`${idPrefix}-name`}>Name</Label>
        <Input
          id={`${idPrefix}-name`}
          value={formData.name}
          onChange={(event) => updateFormData({ name: event.target.value })}
          placeholder={idPrefix === "create" ? "e.g., Leadership" : undefined}
        />
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-description`}>Description</Label>
        <Textarea
          id={`${idPrefix}-description`}
          value={formData.description}
          onChange={(event) => updateFormData({ description: event.target.value })}
          placeholder={idPrefix === "create" ? "Optional description" : undefined}
        />
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-short-description`}>Short Description</Label>
        <Input
          id={`${idPrefix}-short-description`}
          value={formData.shortDescription}
          onChange={(event) => updateFormData({ shortDescription: event.target.value })}
          placeholder="Optional short description (shown in navigation)"
        />
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-trait-category`}>Category</Label>
        <Select
          value={formData.groupId}
          onValueChange={(value) => updateFormData({ groupId: value })}
        >
          <SelectTrigger id={`${idPrefix}-trait-category`}>
            <SelectValue placeholder="Select a category (optional)" />
          </SelectTrigger>
          <SelectContent className="w-[var(--radix-select-trigger-width)]">
            <SelectItem value="">No Category</SelectItem>
            {groups.map((group) => (
              <SelectItem key={group.id} value={group.id}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: group.color }}
                  />
                  {group.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

interface PersonalityTraitDialogProps {
  open: boolean;
  mode: "create" | "edit";
  groups: PersonalityGroup[];
  formData: PersonalityTraitFormData;
  onOpenChange: (open: boolean) => void;
  onFormDataChange: (formData: PersonalityTraitFormData) => void;
  onSubmit: () => void;
}

function PersonalityTraitDialog({
  open,
  mode,
  groups,
  formData,
  onOpenChange,
  onFormDataChange,
  onSubmit,
}: PersonalityTraitDialogProps) {
  const isCreate = mode === "create";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {isCreate && (
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Trait
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isCreate ? "Create" : "Edit"} Personality Trait</DialogTitle>
          <DialogDescription>
            {isCreate
              ? "Create a new personality trait for evaluation"
              : "Update the personality trait details"}
          </DialogDescription>
        </DialogHeader>
        <PersonalityTraitFormFields
          formData={formData}
          groups={groups}
          idPrefix={mode}
          onFormDataChange={onFormDataChange}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit}>{isCreate ? "Create" : "Update"} Trait</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PersonalityTraitCreateDialog(props: Omit<PersonalityTraitDialogProps, "mode">) {
  return <PersonalityTraitDialog {...props} mode="create" />;
}

export function PersonalityTraitEditDialog(props: Omit<PersonalityTraitDialogProps, "mode">) {
  return <PersonalityTraitDialog {...props} mode="edit" />;
}
