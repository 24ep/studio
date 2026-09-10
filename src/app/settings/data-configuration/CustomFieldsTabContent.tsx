"use client";

import { PlusCircle, Settings2 } from 'lucide-react';

import CustomFieldAlertDialog from '@/components/settings/CustomFieldAlertDialog';
import CustomFieldDrawer from '@/components/settings/CustomFieldDrawer';
import CustomFieldModal from '@/components/settings/CustomFieldModal';
import CustomFieldTable from '@/components/settings/CustomFieldTable';
import {
  SettingsEmptyState,
  SettingsLoadingState,
} from '@/components/settings/SettingsTabState';
import { Button } from '@/components/ui/button';
import type { CustomFieldDefinition } from '@/lib/types';
import type { CustomFieldFormValues } from './CustomFieldsTabTypes';

export function CustomFieldsTabContent({
  definitionToDelete,
  definitions,
  editingDefinition,
  handleCancelDelete,
  handleCloseDrawer,
  handleCloseModal,
  handleDelete,
  handleFormSubmit,
  handleOpenDrawer,
  handleOpenModal,
  isDrawerOpen,
  isLoading,
  isModalOpen,
  setDefinitionToDelete,
}: {
  definitionToDelete: CustomFieldDefinition | null;
  definitions: CustomFieldDefinition[];
  editingDefinition: CustomFieldDefinition | null;
  handleCancelDelete: () => void;
  handleCloseDrawer: () => void;
  handleCloseModal: () => void;
  handleDelete: () => Promise<void>;
  handleFormSubmit: (data: CustomFieldFormValues) => Promise<void>;
  handleOpenDrawer: (definition: CustomFieldDefinition) => void;
  handleOpenModal: () => void;
  isDrawerOpen: boolean;
  isLoading: boolean;
  isModalOpen: boolean;
  setDefinitionToDelete: (definition: CustomFieldDefinition | null) => void;
}) {
  return (
    <div className="space-y-6">
      <CustomFieldsTabHeader onAddField={handleOpenModal} />

      {isLoading && definitions.length === 0 ? (
        <SettingsLoadingState label="Loading definitions..." />
      ) : definitions.length === 0 ? (
        <CustomFieldsTabEmptyState onCreateField={handleOpenModal} />
      ) : (
        <div className="overflow-hidden">
          <CustomFieldTable
            fields={definitions}
            isLoading={isLoading}
            onEdit={handleOpenDrawer}
            onDelete={setDefinitionToDelete}
          />
        </div>
      )}

      <CustomFieldModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleFormSubmit}
      />
      <CustomFieldDrawer
        open={isDrawerOpen}
        definition={editingDefinition}
        onClose={handleCloseDrawer}
        onSubmit={handleFormSubmit}
      />
      <CustomFieldAlertDialog
        open={!!definitionToDelete}
        onConfirm={handleDelete}
        onCancel={handleCancelDelete}
        definition={definitionToDelete}
      />
    </div>
  );
}

function CustomFieldsTabHeader({ onAddField }: { onAddField: () => void }) {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h2 className="text-lg font-semibold">Custom Field Definitions</h2>
        <p className="text-sm text-muted-foreground">
          Define custom fields that can be associated with Applicants or Positions.
        </p>
      </div>
      <Button onClick={onAddField} className="btn-primary-gradient">
        <PlusCircle className="mr-2 h-4 w-4" /> Add New Field
      </Button>
    </div>
  );
}

function CustomFieldsTabEmptyState({ onCreateField }: { onCreateField: () => void }) {
  return (
    <SettingsEmptyState
      icon={Settings2}
      title="No Custom Fields"
      description="Create your first custom field to get started."
      action={(
        <Button onClick={onCreateField}>
          <PlusCircle className="mr-2 h-4 w-4" /> Create First Field
        </Button>
      )}
    />
  );
}
