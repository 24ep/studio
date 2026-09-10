"use client";

import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { SkillTemplateDetailsDialog, SkillTemplateFormDialog } from './SkillTemplatesDialogs';
import {
  renderExpertiseTemplatePopover,
  renderPersonalityTemplatePopover,
} from './SkillTemplatesTabPopovers';
import {
  SkillTemplatesEmptyState,
  SkillTemplatesGrid,
  SkillTemplatesTabHeader,
} from './SkillTemplatesTabParts';
import { useSkillTemplatesTab } from './use-skill-templates-tab';

export default function SkillTemplatesTab() {
  const tab = useSkillTemplatesTab();

  if (tab.loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <SkillTemplatesTabHeader
        createButton={
          <SkillTemplateFormDialog
            open={tab.isCreateDialogOpen}
            mode="create"
            formData={tab.templateFormData}
            containerRef={tab.createDialogContainerRef}
            expertisePopover={renderExpertiseTemplatePopover(
              tab,
              tab.isCreateGroupsOpen,
              tab.setIsCreateGroupsOpen,
              'skill-templates-expertise-create',
              tab.createDialogContainerRef.current
            )}
            personalityPopover={renderPersonalityTemplatePopover(
              tab,
              tab.isCreatePersonalityOpen,
              tab.setIsCreatePersonalityOpen,
              'skill-templates-personality-create',
              tab.createDialogContainerRef.current
            )}
            selectedExpertiseGroupNames={tab.selectedNames.expertiseGroups}
            selectedSkillNames={tab.selectedNames.expertiseSkills}
            selectedPersonalityGroupNames={tab.selectedNames.personalityGroups}
            selectedPersonalityTraitNames={tab.selectedNames.personalityTraits}
            onOpenChange={(open) => {
              tab.setIsCreateDialogOpen(open);
              if (!open) {
                tab.closeCreateSelectionPopovers();
              }
            }}
            onFormDataChange={tab.setTemplateFormData}
            onCancel={() => {
              tab.closeCreateSelectionPopovers();
              tab.setIsCreateDialogOpen(false);
            }}
            onSubmit={tab.handleCreateTemplate}
            trigger={
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            }
          />
        }
      />

      <SkillTemplatesGrid
        templates={tab.templates}
        onOpenDetails={tab.openDetailsDialog}
        onOpenEdit={tab.openEditDialog}
        onDelete={tab.handleDeleteTemplate}
      />

      {tab.templates.length === 0 && <SkillTemplatesEmptyState onCreate={() => tab.setIsCreateDialogOpen(true)} />}

      <SkillTemplateFormDialog
        open={tab.isEditDialogOpen}
        mode="edit"
        formData={tab.templateFormData}
        containerRef={tab.editDialogContainerRef}
        expertisePopover={renderExpertiseTemplatePopover(
          tab,
          tab.isEditGroupsOpen,
          tab.setIsEditGroupsOpen,
          'skill-templates-expertise-edit',
          tab.editDialogContainerRef.current
        )}
        personalityPopover={renderPersonalityTemplatePopover(
          tab,
          tab.isEditPersonalityOpen,
          tab.setIsEditPersonalityOpen,
          'skill-templates-personality-edit',
          tab.editDialogContainerRef.current
        )}
        selectedExpertiseGroupNames={tab.selectedNames.expertiseGroups}
        selectedSkillNames={tab.selectedNames.expertiseSkills}
        selectedPersonalityGroupNames={tab.selectedNames.personalityGroups}
        selectedPersonalityTraitNames={tab.selectedNames.personalityTraits}
        onOpenChange={(open) => {
          tab.setIsEditDialogOpen(open);
          if (!open) {
            tab.closeEditSelectionPopovers();
          }
        }}
        onFormDataChange={tab.setTemplateFormData}
        onCancel={() => {
          tab.closeEditSelectionPopovers();
          tab.setIsEditDialogOpen(false);
        }}
        onSubmit={tab.handleUpdateTemplate}
      />

      <SkillTemplateDetailsDialog
        open={tab.isDetailsDialogOpen}
        selectedTemplate={tab.selectedTemplate}
        onOpenChange={tab.setIsDetailsDialogOpen}
        onEdit={tab.openEditDialog}
      />
    </div>
  );
}
