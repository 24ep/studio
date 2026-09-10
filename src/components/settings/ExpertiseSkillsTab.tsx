"use client";

import { ExpertiseSkillCreateDialog, ExpertiseSkillEditDialog } from "./ExpertiseSkillFormDialog";
import { ExpertiseSkillsTable } from "./ExpertiseSkillsTable";
import { useExpertiseSkillsTab } from "./use-expertise-skills-tab";

export default function ExpertiseSkillsTab() {
  const tab = useExpertiseSkillsTab();

  if (tab.loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Expertise Skills</h3>
          <p className="text-sm text-muted-foreground">
            Manage individual expertise skills with scoring and categorization
          </p>
        </div>
        <ExpertiseSkillCreateDialog
          open={tab.isCreateDialogOpen}
          groups={tab.groups}
          formData={tab.formData}
          onOpenChange={tab.setIsCreateDialogOpen}
          onFormDataChange={tab.setFormData}
          onSubmit={tab.handleCreateSkill}
        />
      </div>

      <ExpertiseSkillsTable
        skills={tab.skills}
        onEdit={tab.openEditDialog}
        onDelete={tab.handleDeleteSkill}
        onToggleActive={tab.handleToggleActive}
      />

      <ExpertiseSkillEditDialog
        open={tab.isEditDialogOpen}
        groups={tab.groups}
        formData={tab.formData}
        onOpenChange={tab.setIsEditDialogOpen}
        onFormDataChange={tab.setFormData}
        onSubmit={tab.handleUpdateSkill}
      />
    </div>
  );
}
