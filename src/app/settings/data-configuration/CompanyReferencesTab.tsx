"use client";

import { SettingsErrorState } from '@/components/settings/SettingsTabState';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  CompanyReferenceDeleteDialog,
  CompanyReferenceModal,
  CompanyReferencesTabContent,
  CompanyReferencesTabHeader,
} from './CompanyReferencesTabParts';
import { useCompanyReferencesTab } from './use-company-references-tab';

export function CompanyReferencesTab() {
  const tab = useCompanyReferencesTab();

  if (tab.fetchError) {
    return <SettingsErrorState message={tab.fetchError} />;
  }

  return (
    <ScrollArea className="h-full pr-4">
      <div className="space-y-6">
        <CompanyReferencesTabHeader
          appKitLoad={tab.appKitLoad}
          onCreate={tab.openCreateModal}
          onLoadFromAppKit={tab.handleLoadFromAppKit}
        />
        <CompanyReferencesTabContent
          companies={tab.companies}
          isLoading={tab.isLoading}
          onCreate={tab.openCreateModal}
          onEdit={tab.openEditModal}
          onDelete={tab.setCompanyToDelete}
        />
      </div>

      <CompanyReferenceModal
        open={tab.isModalOpen}
        company={tab.editingCompany}
        onClose={tab.closeModal}
        onSubmit={tab.handleSave}
      />
      <CompanyReferenceDeleteDialog
        company={tab.companyToDelete}
        onCancel={() => tab.setCompanyToDelete(null)}
        onConfirm={tab.handleDeleteSelected}
      />
    </ScrollArea>
  );
}
