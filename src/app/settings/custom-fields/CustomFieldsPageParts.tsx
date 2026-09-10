"use client";

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import CustomFieldAlertDialog from '@/components/settings/CustomFieldAlertDialog';
import CustomFieldDrawer from '@/components/settings/CustomFieldDrawer';
import type { CustomFieldFormValues as CustomFieldDrawerFormValues } from '@/components/settings/CustomFieldDrawerParts';
import CustomFieldModal from '@/components/settings/CustomFieldModal';
import type { CustomFieldFormValues as CustomFieldModalFormValues } from '@/components/settings/CustomFieldModalSchema';
import CustomFieldTable from '@/components/settings/CustomFieldTable';
import type { CustomFieldDefinition } from '@/lib/types';
import { Loader2, PlusCircle, ServerCrash, Settings2 } from 'lucide-react';

export type CustomFieldFormValues = CustomFieldDrawerFormValues | CustomFieldModalFormValues;

export function CustomFieldsLoadingScreen() {
  return (
    <div className="flex w-screen items-center justify-center bg-background fixed inset-0 z-50">
      <Loader2 className="h-16 w-16 animate-spin text-primary" />
    </div>
  );
}

export function CustomFieldsErrorState({
  fetchError,
  onGoDashboard,
}: {
  fetchError: string;
  onGoDashboard: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center p-4">
      <ServerCrash className="w-16 h-16 text-destructive mb-4" />
      <h2 className="text-2xl font-semibold text-foreground mb-2">Error Loading Data</h2>
      <p className="text-muted-foreground mb-4 max-w-md">{fetchError}</p>
      {fetchError === "You do not have permission to manage custom field definitions." ? (
        <Button onClick={onGoDashboard} className="btn-hover-primary-gradient">Go to Dashboard</Button>
      ) : null}
    </div>
  );
}

export function CustomFieldsPageHeader({ onAddNew }: { onAddNew: () => void }) {
  return (
    <div className="p-6 pb-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h2 className="flex items-center text-2xl">
            <Settings2 className="mr-3 h-6 w-6 text-primary" />
            Custom Field Definitions
          </h2>
          <p>
            Define custom fields that can be associated with Applicants, Positions, Users, or Headcount records.
            These fields are stored in a flexible JSONB column. The actual rendering of these fields on forms is a future enhancement.
          </p>
        </div>
        <Button onClick={onAddNew} className="btn-primary-gradient mt-2 sm:mt-0">
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Field Definition
        </Button>
      </div>
    </div>
  );
}

export function CustomFieldsPageContent({
  definitions,
  fetchError,
  isLoading,
  onDelete,
  onEdit,
}: {
  definitions: CustomFieldDefinition[];
  fetchError: string | null;
  isLoading: boolean;
  onDelete: (definition: CustomFieldDefinition) => void;
  onEdit: (definition: CustomFieldDefinition) => void;
}) {
  return (
    <ScrollArea className="flex-1 p-6 pt-0 [&_.simplebar-scrollbar]:bg-muted-foreground/20 [&_.simplebar-scrollbar]:hover:bg-muted-foreground/40 [&_.simplebar-scrollbar]:w-2 [&_.simplebar-scrollbar]:rounded-full">
      <div className="space-y-6">
        {isLoading && definitions.length === 0 ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2 text-muted-foreground">Loading definitions...</p>
          </div>
        ) : definitions.length === 0 && !fetchError ? (
          <p className="text-muted-foreground text-center py-8">No custom field definitions yet.</p>
        ) : (
          <div className="rounded-lg overflow-hidden">
            <CustomFieldTable
              fields={definitions}
              isLoading={isLoading}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

export function CustomFieldsPageModals({
  definitionToDelete,
  editingDefinition,
  isDrawerOpen,
  isModalOpen,
  onCancelDelete,
  onCloseDrawer,
  onCloseModal,
  onConfirmDelete,
  onSubmit,
}: {
  definitionToDelete: CustomFieldDefinition | null;
  editingDefinition: CustomFieldDefinition | null;
  isDrawerOpen: boolean;
  isModalOpen: boolean;
  onCancelDelete: () => void;
  onCloseDrawer: () => void;
  onCloseModal: () => void;
  onConfirmDelete: () => void;
  onSubmit: (data: CustomFieldFormValues) => Promise<void>;
}) {
  return (
    <>
      <CustomFieldModal
        open={isModalOpen}
        onClose={onCloseModal}
        onSubmit={onSubmit}
      />
      <CustomFieldDrawer
        open={isDrawerOpen}
        definition={editingDefinition}
        onClose={onCloseDrawer}
        onSubmit={onSubmit}
      />
      <CustomFieldAlertDialog
        open={!!definitionToDelete}
        onConfirm={onConfirmDelete}
        onCancel={onCancelDelete}
        definition={definitionToDelete}
      />
    </>
  );
}
