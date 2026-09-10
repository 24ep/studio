"use client";

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Brain, Heart, Users } from 'lucide-react';
import type { SkillTemplate } from './skill-templates-utils';
import {
  SkillTemplateGroupsSection,
  SkillTemplateSkillsSection,
  SkillTemplateTraitsSection,
} from './SkillTemplateDetailsSections';

export function SkillTemplateDetailsDialog({
  open,
  selectedTemplate,
  onOpenChange,
  onEdit,
}: {
  open: boolean;
  selectedTemplate: SkillTemplate | null;
  onOpenChange: (open: boolean) => void;
  onEdit: (template: SkillTemplate) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{selectedTemplate?.name}</DialogTitle>
          <DialogDescription>
            {selectedTemplate?.description || 'Template details and assigned groups/skills'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <SkillTemplateGroupsSection
            title="Expertise Groups"
            icon={<Users className="h-4 w-4" />}
            count={selectedTemplate?.templateGroups.length || 0}
            emptyText="No expertise groups assigned"
            groups={selectedTemplate?.templateGroups.map(templateGroup => templateGroup.group) || []}
          />
          <SkillTemplateSkillsSection
            title="Expertise Skills"
            icon={<Brain className="h-4 w-4" />}
            count={selectedTemplate?.templateSkills.length || 0}
            emptyText="No expertise skills assigned"
            skills={selectedTemplate?.templateSkills.map(templateSkill => templateSkill.skill) || []}
          />
          <SkillTemplateGroupsSection
            title="Personality Groups"
            icon={<Heart className="h-4 w-4" />}
            count={selectedTemplate?.templatePersonalityGroups?.length || 0}
            emptyText="No personality groups assigned"
            groups={selectedTemplate?.templatePersonalityGroups?.map(templateGroup => templateGroup.group) || []}
          />
          <SkillTemplateTraitsSection
            traits={selectedTemplate?.templatePersonalityTraits?.map(templateTrait => templateTrait.trait) || []}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            onClick={() => {
              onOpenChange(false);
              if (selectedTemplate) {
                onEdit(selectedTemplate);
              }
            }}
          >
            Edit Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
