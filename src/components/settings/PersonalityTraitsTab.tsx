"use client";

import { PersonalityTraitCreateDialog, PersonalityTraitEditDialog } from "./PersonalityTraitFormDialog";
import { PersonalityTraitsTable } from "./PersonalityTraitsTable";
import { usePersonalityTraitsTab } from "./use-personality-traits-tab";

export default function PersonalityTraitsTab() {
  const tab = usePersonalityTraitsTab();

  if (tab.loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-base font-semibold">Personality Traits</h3>
          <p className="text-sm text-muted-foreground">
            Manage individual personality traits (soft skills) for evaluation
          </p>
        </div>
        <PersonalityTraitCreateDialog
          open={tab.isCreateDialogOpen}
          groups={tab.groups}
          formData={tab.formData}
          onOpenChange={tab.setIsCreateDialogOpen}
          onFormDataChange={tab.setFormData}
          onSubmit={tab.handleCreateTrait}
        />
      </div>

      <PersonalityTraitsTable
        traits={tab.traits}
        onEdit={tab.openEditDialog}
        onDelete={tab.handleDeleteTrait}
        onToggleActive={tab.handleToggleActive}
      />

      <PersonalityTraitEditDialog
        open={tab.isEditDialogOpen}
        groups={tab.groups}
        formData={tab.formData}
        onOpenChange={tab.setIsEditDialogOpen}
        onFormDataChange={tab.setFormData}
        onSubmit={tab.handleUpdateTrait}
      />
    </div>
  );
}
