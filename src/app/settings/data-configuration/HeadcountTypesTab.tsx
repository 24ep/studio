"use client";

import { AlertCircle, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SettingsLoadingState } from "@/components/settings/SettingsTabState";

import { HeadcountTypeModal } from "./HeadcountTypeModal";
import { HeadcountTypesList } from "./HeadcountTypesList";
import { useHeadcountTypesTab } from "./use-headcount-types-tab";

export function HeadcountTypesTab() {
  const tab = useHeadcountTypesTab();

  if (tab.loading) {
    return <SettingsLoadingState label="Loading headcount types..." />;
  }

  if (tab.error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-600">{tab.error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Headcount Types</h3>
          <p className="text-sm text-muted-foreground">
            Configure the types of headcount positions available in the system
          </p>
        </div>
        <Button onClick={tab.handleAddOption}>
          <Plus className="h-4 w-4 mr-2" />
          Add Type
        </Button>
      </div>

      <HeadcountTypesList
        options={tab.options}
        onDelete={tab.handleDeleteOption}
        onDragEnd={tab.handleDragEnd}
        onEdit={tab.handleEditOption}
        onToggleActive={tab.handleToggleActive}
      />

      {tab.isModalOpen && tab.editingOption && (
        <HeadcountTypeModal
          option={tab.editingOption}
          existingValues={tab.options.map((option) => option.value)}
          onSave={tab.handleSaveOption}
          onCancel={tab.closeModal}
        />
      )}
    </div>
  );
}
