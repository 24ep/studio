"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import type { ExpertiseGroup, ExpertiseSkillFormData } from "./ExpertiseSkillsTabTypes";

interface ExpertiseSkillFormFieldsProps {
  formData: ExpertiseSkillFormData;
  groups: ExpertiseGroup[];
  idPrefix: string;
  onFormDataChange: (formData: ExpertiseSkillFormData) => void;
}

function ExpertiseSkillFormFields({
  formData,
  groups,
  idPrefix,
  onFormDataChange,
}: ExpertiseSkillFormFieldsProps) {
  const updateFormData = (updates: Partial<ExpertiseSkillFormData>) => {
    onFormDataChange({ ...formData, ...updates });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor={`${idPrefix}-name`}>Name</Label>
        <Input
          id={`${idPrefix}-name`}
          value={formData.name}
          onChange={(event) => updateFormData({ name: event.target.value })}
          placeholder={idPrefix === "create" ? "e.g., JavaScript Programming" : undefined}
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
        <Label htmlFor={`${idPrefix}-max-score`}>Max Score</Label>
        <Input
          id={`${idPrefix}-max-score`}
          type="number"
          min="1"
          max="1000"
          value={formData.maxScore}
          onChange={(event) => updateFormData({ maxScore: parseInt(event.target.value) || 100 })}
        />
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-skill-type`}>Skill Type</Label>
        <Select
          value={formData.skillType}
          onValueChange={(value) => updateFormData({ skillType: value })}
        >
          <SelectTrigger id={`${idPrefix}-skill-type`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hard_skill">Hard Skill</SelectItem>
            <SelectItem value="test_score">Test Score</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-skill-category`}>Category</Label>
        <Select
          value={formData.groupId}
          onValueChange={(value) => updateFormData({ groupId: value })}
        >
          <SelectTrigger id={`${idPrefix}-skill-category`}>
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

interface ExpertiseSkillCreateDialogProps {
  open: boolean;
  groups: ExpertiseGroup[];
  formData: ExpertiseSkillFormData;
  onOpenChange: (open: boolean) => void;
  onFormDataChange: (formData: ExpertiseSkillFormData) => void;
  onSubmit: () => void;
}

export function ExpertiseSkillCreateDialog({
  open,
  groups,
  formData,
  onOpenChange,
  onFormDataChange,
  onSubmit,
}: ExpertiseSkillCreateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Skill
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Expertise Skill</DialogTitle>
          <DialogDescription>
            Create a new expertise skill for evaluation
          </DialogDescription>
        </DialogHeader>
        <ExpertiseSkillFormFields
          formData={formData}
          groups={groups}
          idPrefix="create"
          onFormDataChange={onFormDataChange}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit}>Create Skill</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ExpertiseSkillEditDialogProps {
  open: boolean;
  groups: ExpertiseGroup[];
  formData: ExpertiseSkillFormData;
  onOpenChange: (open: boolean) => void;
  onFormDataChange: (formData: ExpertiseSkillFormData) => void;
  onSubmit: () => void;
}

export function ExpertiseSkillEditDialog({
  open,
  groups,
  formData,
  onOpenChange,
  onFormDataChange,
  onSubmit,
}: ExpertiseSkillEditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Expertise Skill</DialogTitle>
          <DialogDescription>
            Update the expertise skill details
          </DialogDescription>
        </DialogHeader>
        <ExpertiseSkillFormFields
          formData={formData}
          groups={groups}
          idPrefix="edit"
          onFormDataChange={onFormDataChange}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit}>Update Skill</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
