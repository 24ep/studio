"use client";

import { Dispatch, SetStateAction } from 'react';
import { BrainCircuit, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { SystemPrompt, SystemPromptCategory } from './types';
import { SystemPromptCard } from './SystemPromptCard';
import { SystemPromptsListToolbar } from './SystemPromptsListToolbar';

interface SystemPromptsListTabProps {
  isLoading: boolean;
  searchTerm: string;
  setSearchTerm: Dispatch<SetStateAction<string>>;
  selectedCategory: string;
  setSelectedCategory: Dispatch<SetStateAction<string>>;
  categories: SystemPromptCategory[];
  filteredPrompts: SystemPrompt[];
  isImportingAppKit?: {
    environment: "development" | "production";
    percent: number;
    message: string;
  } | null;
  onCreatePrompt: () => void;
  onEditPrompt: (prompt: SystemPrompt) => void;
  onDeletePrompt: (id: string) => void;
  onLoadFromAppKit?: (environment: 'development' | 'production') => void;
  onShowCategories: () => void;
}

export function SystemPromptsListTab({
  isLoading,
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  categories,
  filteredPrompts,
  isImportingAppKit,
  onCreatePrompt,
  onEditPrompt,
  onDeletePrompt,
  onLoadFromAppKit,
  onShowCategories,
}: SystemPromptsListTabProps) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <SystemPromptsListToolbar
        categories={categories}
        isImportingAppKit={isImportingAppKit}
        onCreatePrompt={onCreatePrompt}
        onLoadFromAppKit={onLoadFromAppKit}
        searchTerm={searchTerm}
        selectedCategory={selectedCategory}
        setSearchTerm={setSearchTerm}
        setSelectedCategory={setSelectedCategory}
      />

      <ScrollArea className="min-h-0 flex-1 pr-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12">
            <BrainCircuit className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No system prompt categories found</h3>
            <p className="text-muted-foreground mb-4">
              You need to create at least one category before you can create system prompts.
            </p>
            <Button onClick={onShowCategories}>
              <Plus className="h-4 w-4 mr-2" />
              Create Categories
            </Button>
          </div>
        ) : filteredPrompts.length === 0 ? (
          <div className="text-center py-12">
            <BrainCircuit className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No system prompts found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || selectedCategory !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Create your first system prompt to get started.'
              }
            </p>
            {!searchTerm && selectedCategory === 'all' && (
              <Button onClick={onCreatePrompt}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Prompt
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPrompts.map((prompt) => (
              <SystemPromptCard
                key={prompt.id}
                onDeletePrompt={onDeletePrompt}
                onEditPrompt={onEditPrompt}
                prompt={prompt}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
