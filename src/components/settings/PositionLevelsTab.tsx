"use client";

import { DownloadCloud, Loader2, PlusCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { PositionLevelDeleteDialog } from './PositionLevelDeleteDialog';
import { PositionLevelFormDialog } from './PositionLevelFormDialog';
import { PositionLevelsList } from './PositionLevelsList';
import {
  PositionLevelsErrorState,
  PositionLevelsLoadingState,
} from './PositionLevelsTabStates';
import { usePositionLevelsTab } from './use-position-levels-tab';

export function PositionLevelsTab() {
  const tab = usePositionLevelsTab();
  const loadingForDevelopment =
    tab.isImportingAppKit && tab.appKitLoad?.environment === 'development' && tab.appKitLoad;
  const loadingForProduction =
    tab.isImportingAppKit && tab.appKitLoad?.environment === 'production' && tab.appKitLoad;

  if (tab.isLoading) {
    return <PositionLevelsLoadingState />;
  }

  if (tab.fetchError) {
    return (
      <PositionLevelsErrorState
        fetchError={tab.fetchError}
        onRetry={tab.loadLevels}
      />
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex-shrink-0 space-y-6 pb-6">
        <div className="flex flex-wrap justify-between items-start gap-3">
          <div>
            <h2 className="text-2xl font-bold">Position Level Management</h2>
            <p className="text-muted-foreground">
              Manage the list of standardized position levels used across positions.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={tab.isImportingAppKit}
              onClick={() => tab.handleLoadFromAppKit('development')}
            >
              {loadingForDevelopment ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <DownloadCloud className="h-4 w-4 mr-2" />
              )}
              {loadingForDevelopment
                ? `${loadingForDevelopment.percent}% · ${loadingForDevelopment.message}`
                : 'Load development levels'}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={tab.isImportingAppKit}
              onClick={() => tab.handleLoadFromAppKit('production')}
            >
              {loadingForProduction ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <DownloadCloud className="h-4 w-4 mr-2" />
              )}
              {loadingForProduction
                ? `${loadingForProduction.percent}% · ${loadingForProduction.message}`
                : 'Load live levels'}
            </Button>
            <Button onClick={() => tab.openModal()}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Position Level
            </Button>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain pr-4 custom-scrollbar">
        <PositionLevelsList
          levels={tab.levels}
          onDelete={tab.setLevelToDelete}
          onDragEnd={tab.handleDragEnd}
          onEdit={tab.openModal}
        />
      </div>

      <PositionLevelFormDialog
        editingLevel={tab.editingLevel}
        formData={tab.formData}
        isSubmitting={tab.isSubmitting}
        onClose={tab.closeModal}
        onFormDataChange={tab.setFormData}
        onOpenChange={tab.setIsModalOpen}
        onSubmit={tab.submitForm}
        open={tab.isModalOpen}
      />

      <PositionLevelDeleteDialog
        levelToDelete={tab.levelToDelete}
        onConfirm={tab.deleteSelectedLevel}
        onOpenChange={() => tab.setLevelToDelete(null)}
      />
    </div>
  );
}
