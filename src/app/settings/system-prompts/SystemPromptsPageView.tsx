"use client";

import { FileText, Loader2, Tag } from 'lucide-react';

import { cn } from '@/lib/utils';
import { getUnderlineNavTriggerClassName } from '@/components/ui/underline-nav';

import { SystemPromptCategoriesTab } from './SystemPromptCategoriesTab';
import { SystemPromptCategoryModal } from './SystemPromptCategoryModal';
import { SystemPromptModal } from './SystemPromptModal';
import { SystemPromptsListTab } from './SystemPromptsListTab';
import type { useSystemPromptsPage } from './use-system-prompts-page';

type SystemPromptsPageViewProps = ReturnType<typeof useSystemPromptsPage>;

export function SystemPromptsPageView(page: SystemPromptsPageViewProps) {
  if (page.sessionStatus === 'loading') {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (page.sessionStatus === 'unauthenticated') {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="text-muted-foreground">You need to be logged in to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col p-6">
      <div className="min-h-0 flex-1 overflow-hidden">
        <div className="flex h-full min-h-0 flex-col">
          <div className="mb-6 flex w-full flex-shrink-0 border-b border-border/50">
            <SystemPromptsTabButton
              active={page.activeTab === 'prompts'}
              icon={<FileText className="h-4 w-4" />}
              label="System Prompts"
              onClick={() => page.setActiveTab('prompts')}
            />
            <SystemPromptsTabButton
              active={page.activeTab === 'categories'}
              icon={<Tag className="h-4 w-4" />}
              label="Categories"
              onClick={() => page.setActiveTab('categories')}
            />
          </div>

          <div className="min-h-0 flex-1 overflow-hidden">
            {page.activeTab === 'prompts' && (
              <SystemPromptsListTab
                isLoading={page.isLoading}
                searchTerm={page.searchTerm}
                setSearchTerm={page.setSearchTerm}
                selectedCategory={page.selectedCategory}
                setSelectedCategory={page.setSelectedCategory}
                categories={page.categories}
                filteredPrompts={page.filteredPrompts}
                isImportingAppKit={page.isImportingAppKit}
                onCreatePrompt={page.openCreatePromptModal}
                onEditPrompt={page.openEditPromptModal}
                onDeletePrompt={page.handleDeletePrompt}
                onLoadFromAppKit={page.handleLoadFromAppKit}
                onShowCategories={() => page.setActiveTab('categories')}
              />
            )}

            {page.activeTab === 'categories' && (
              <SystemPromptCategoriesTab
                isLoading={page.isLoading}
                categorySearchTerm={page.categorySearchTerm}
                setCategorySearchTerm={page.setCategorySearchTerm}
                filteredCategories={page.filteredCategories}
                onCreateCategory={page.openCreateCategoryModal}
                onEditCategory={page.openEditCategoryModal}
                onDeleteCategory={page.handleDeleteCategory}
              />
            )}
          </div>
        </div>
      </div>

      <SystemPromptModal
        open={page.isPromptModalOpen}
        onOpenChange={page.setIsPromptModalOpen}
        editingPrompt={page.editingPrompt}
        formData={page.promptFormData}
        setFormData={page.setPromptFormData}
        categories={page.categories}
        onSave={page.handleSavePrompt}
      />

      <SystemPromptCategoryModal
        open={page.isCategoryModalOpen}
        onOpenChange={page.setIsCategoryModalOpen}
        editingCategory={page.editingCategory}
        formData={page.categoryFormData}
        setFormData={page.setCategoryFormData}
        onSave={page.handleSaveCategory}
      />
    </div>
  );
}

function SystemPromptsTabButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        getUnderlineNavTriggerClassName(active),
        "px-6 py-3",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
