"use client";

import {
  CustomFieldsErrorState,
  CustomFieldsLoadingScreen,
  CustomFieldsPageContent,
  CustomFieldsPageHeader,
  CustomFieldsPageModals,
} from './CustomFieldsPageParts';
import { useCustomFieldsPage } from './use-custom-fields-page';

export default function CustomFieldsPage() {
  const page = useCustomFieldsPage();

  if (page.showFullPageLoader) {
    return <CustomFieldsLoadingScreen />;
  }

  if (page.fetchError) {
    return (
      <CustomFieldsErrorState
        fetchError={page.fetchError}
        onGoDashboard={page.goDashboard}
      />
    );
  }

  return (
    <div className="h-full flex flex-col">
      <CustomFieldsPageHeader onAddNew={page.openModal} />
      <CustomFieldsPageContent
        definitions={page.definitions}
        fetchError={page.fetchError}
        isLoading={page.isLoading}
        onDelete={page.setDefinitionToDelete}
        onEdit={page.handleOpenDrawer}
      />
      <CustomFieldsPageModals
        definitionToDelete={page.definitionToDelete}
        editingDefinition={page.editingDefinition}
        isDrawerOpen={page.isDrawerOpen}
        isModalOpen={page.isModalOpen}
        onCancelDelete={() => page.setDefinitionToDelete(null)}
        onCloseDrawer={() => page.setIsDrawerOpen(false)}
        onCloseModal={() => page.setIsModalOpen(false)}
        onConfirmDelete={page.handleDelete}
        onSubmit={page.handleFormSubmit}
      />
    </div>
  );
}
