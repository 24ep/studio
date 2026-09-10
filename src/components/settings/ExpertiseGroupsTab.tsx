"use client";

import { ExpertiseAddSkillDialog, ExpertiseGroupDialog } from "./ExpertiseGroupsTabDialogs";
import { ExpertiseGroupsList } from "./ExpertiseGroupsList";
import { useExpertiseGroupsTab } from "./use-expertise-groups-tab";

export default function ExpertiseGroupsTab() {
  const tab = useExpertiseGroupsTab();

  if (tab.loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Expertise Skill Groups</h3>
          <p className="text-sm text-muted-foreground">
            Create and manage groups of expertise skills for evaluation
          </p>
        </div>
        <ExpertiseGroupDialog
          open={tab.isCreateDialogOpen}
          mode="create"
          formData={tab.formData}
          onOpenChange={tab.setIsCreateDialogOpen}
          onFormDataChange={tab.setFormData}
          onSubmit={tab.handleCreateGroup}
        />
      </div>

      <ExpertiseGroupsList
        groups={tab.groups}
        skills={tab.skills}
        onAddSkill={tab.openAddSkillDialog}
        onEditGroup={tab.openEditDialog}
        onDeleteGroup={tab.handleDeleteGroup}
        onRemoveSkill={tab.handleRemoveSkillFromGroup}
      />

      <ExpertiseGroupDialog
        open={tab.isEditDialogOpen}
        mode="edit"
        formData={tab.formData}
        onOpenChange={tab.setIsEditDialogOpen}
        onFormDataChange={tab.setFormData}
        onSubmit={tab.handleUpdateGroup}
      />

      <ExpertiseAddSkillDialog
        open={tab.isAddSkillDialogOpen}
        groupName={tab.selectedGroup?.name}
        formData={tab.skillFormData}
        onOpenChange={tab.setIsAddSkillDialogOpen}
        onFormDataChange={tab.setSkillFormData}
        onSubmit={tab.handleAddSkillToGroup}
      />
    </div>
  );
}
