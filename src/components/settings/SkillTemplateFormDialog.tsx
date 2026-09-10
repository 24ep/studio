"use client";

import React, { type ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { SkillTemplateFormData } from './skill-templates-utils';

interface SkillTemplateFormDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  formData: SkillTemplateFormData;
  containerRef: React.Ref<HTMLDivElement>;
  expertisePopover: ReactNode;
  personalityPopover: ReactNode;
  selectedExpertiseGroupNames: string[];
  selectedSkillNames: string[];
  selectedPersonalityGroupNames: string[];
  selectedPersonalityTraitNames: string[];
  trigger?: ReactNode;
  onOpenChange: (open: boolean) => void;
  onFormDataChange: (data: SkillTemplateFormData) => void;
  onCancel: () => void;
  onSubmit: () => void;
}

function SelectedNameBadges({
  idPrefix,
  names,
}: {
  idPrefix: string;
  names: string[];
}) {
  if (names.length === 0) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {names.map((name, index) => (
        <Badge key={`${idPrefix}-${index}`} variant="secondary" className="text-xs">
          {name}
        </Badge>
      ))}
    </div>
  );
}

export function SkillTemplateFormDialog({
  open,
  mode,
  formData,
  containerRef,
  expertisePopover,
  personalityPopover,
  selectedExpertiseGroupNames,
  selectedSkillNames,
  selectedPersonalityGroupNames,
  selectedPersonalityTraitNames,
  trigger,
  onOpenChange,
  onFormDataChange,
  onCancel,
  onSubmit,
}: SkillTemplateFormDialogProps) {
  const isCreate = mode === 'create';
  const fieldPrefix = isCreate ? '' : 'edit-';
  const dialogId = isCreate ? 'skill-template-create-dialog' : 'skill-template-edit-dialog';
  const expertiseNames = [...selectedExpertiseGroupNames, ...selectedSkillNames];
  const personalityNames = [...selectedPersonalityGroupNames, ...selectedPersonalityTraitNames];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-2xl" dialogId={dialogId}>
        <DialogHeader>
          <DialogTitle>{isCreate ? 'Create' : 'Edit'} Skill Template</DialogTitle>
          <DialogDescription>
            {isCreate
              ? 'Create a new template with selected groups and skills'
              : 'Update the template with selected groups and skills'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4" ref={containerRef}>
          <div>
            <Label htmlFor={`${fieldPrefix}name`}>Template Name</Label>
            <Input
              id={`${fieldPrefix}name`}
              value={formData.name}
              onChange={(event) => onFormDataChange({ ...formData, name: event.target.value })}
              placeholder="e.g., Frontend Developer Template"
            />
          </div>
          <div>
            <Label htmlFor={`${fieldPrefix}description`}>Description</Label>
            <Textarea
              id={`${fieldPrefix}description`}
              value={formData.description}
              onChange={(event) => onFormDataChange({ ...formData, description: event.target.value })}
              placeholder="Optional description"
            />
          </div>

          <div>
            <Label>Expertise Groups & Skills</Label>
            {expertisePopover}
            <SelectedNameBadges idPrefix={`${mode}-expertise`} names={expertiseNames} />
          </div>

          <div>
            <Label>Personality Groups & Traits</Label>
            {personalityPopover}
            <SelectedNameBadges idPrefix={`${mode}-personality`} names={personalityNames} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onSubmit}>
            {isCreate ? 'Create' : 'Update'} Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
