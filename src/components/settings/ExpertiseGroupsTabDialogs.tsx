"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ColorPicker } from "@/components/ui/color-picker";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import type {
  ExpertiseGroupFormData,
  ExpertiseSkillCreateFormData,
} from "./ExpertiseGroupsTabTypes";

interface ExpertiseGroupFormFieldsProps {
  formData: ExpertiseGroupFormData;
  idPrefix: string;
  onChange: (formData: ExpertiseGroupFormData) => void;
}

function ExpertiseGroupFormFields({ formData, idPrefix, onChange }: ExpertiseGroupFormFieldsProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor={`${idPrefix}-name`}>Name</Label>
        <Input
          id={`${idPrefix}-name`}
          value={formData.name}
          onChange={(event) => onChange({ ...formData, name: event.target.value })}
          placeholder={idPrefix === "create" ? "e.g., Technical Skills" : undefined}
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
          value={formData.color || "#3B82F6"}
          onChange={(color) => onChange({ ...formData, color })}
          className="w-full"
        />
      </div>
    </div>
  );
}

interface ExpertiseGroupDialogProps {
  open: boolean;
  mode: "create" | "edit";
  formData: ExpertiseGroupFormData;
  onOpenChange: (open: boolean) => void;
  onFormDataChange: (formData: ExpertiseGroupFormData) => void;
  onSubmit: () => void;
}

export function ExpertiseGroupDialog({
  open,
  mode,
  formData,
  onOpenChange,
  onFormDataChange,
  onSubmit,
}: ExpertiseGroupDialogProps) {
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
          <DialogTitle>{isCreate ? "Create" : "Edit"} Expertise Group</DialogTitle>
          <DialogDescription>
            {isCreate
              ? "Create a new group to organize related expertise skills"
              : "Update the expertise group details"}
          </DialogDescription>
        </DialogHeader>
        <ExpertiseGroupFormFields
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

interface ExpertiseAddSkillDialogProps {
  open: boolean;
  groupName?: string;
  formData: ExpertiseSkillCreateFormData;
  onOpenChange: (open: boolean) => void;
  onFormDataChange: (formData: ExpertiseSkillCreateFormData) => void;
  onSubmit: () => void;
}

export function ExpertiseAddSkillDialog({
  open,
  groupName,
  formData,
  onOpenChange,
  onFormDataChange,
  onSubmit,
}: ExpertiseAddSkillDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Skill to Group</DialogTitle>
          <DialogDescription>
            Add a new skill to the "{groupName}" group
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="skill-name">Skill Name</Label>
            <Input
              id="skill-name"
              value={formData.name}
              onChange={(event) => onFormDataChange({ ...formData, name: event.target.value })}
              placeholder="e.g., JavaScript"
            />
          </div>
          <div>
            <Label htmlFor="skill-description">Description</Label>
            <Textarea
              id="skill-description"
              value={formData.description}
              onChange={(event) => onFormDataChange({ ...formData, description: event.target.value })}
              placeholder="Optional description"
            />
          </div>
          <div>
            <Label htmlFor="skill-type">Skill Type</Label>
            <Select
              value={formData.skillType}
              onValueChange={(value) => onFormDataChange({ ...formData, skillType: value })}
            >
              <SelectTrigger id="skill-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hard_skill">Hard Skill</SelectItem>
                <SelectItem value="test_score">Test Score</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="max-score">Max Score</Label>
            <Input
              id="max-score"
              type="number"
              min="1"
              max="1000"
              value={formData.maxScore}
              onChange={(event) => onFormDataChange({ ...formData, maxScore: parseInt(event.target.value) || 100 })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit}>Add Skill</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
