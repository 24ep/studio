"use client";

import { PersonalityAddTraitDialog, PersonalityGroupDialog } from "./PersonalityGroupsTabDialogs";
import { PersonalityGroupsList } from "./PersonalityGroupsList";
import { usePersonalityGroupsTab } from "./use-personality-groups-tab";

export default function PersonalityGroupsTab() {
  const tab = usePersonalityGroupsTab();

  if (tab.loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Personality Groups</h3>
          <p className="text-sm text-muted-foreground">
            Create and manage groups of personality traits (soft skills) for evaluation
          </p>
        </div>
        <PersonalityGroupDialog
          open={tab.isCreateDialogOpen}
          mode="create"
          formData={tab.formData}
          onOpenChange={tab.setIsCreateDialogOpen}
          onFormDataChange={tab.setFormData}
          onSubmit={tab.handleCreateGroup}
        />
      </div>

      <PersonalityGroupsList
        groups={tab.groups}
        traits={tab.traits}
        onAddTrait={tab.openAddTraitDialog}
        onEditGroup={tab.openEditDialog}
        onDeleteGroup={tab.handleDeleteGroup}
        onRemoveTrait={tab.handleRemoveTraitFromGroup}
      />

      <PersonalityGroupDialog
        open={tab.isEditDialogOpen}
        mode="edit"
        formData={tab.formData}
        onOpenChange={tab.setIsEditDialogOpen}
        onFormDataChange={tab.setFormData}
        onSubmit={tab.handleUpdateGroup}
      />

      <PersonalityAddTraitDialog
        open={tab.isAddTraitDialogOpen}
        groupName={tab.selectedGroup?.name}
        formData={tab.traitFormData}
        onOpenChange={tab.setIsAddTraitDialogOpen}
        onFormDataChange={tab.setTraitFormData}
        onSubmit={tab.handleAddTraitToGroup}
      />
    </div>
  );
}
