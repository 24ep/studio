"use client";

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowPathIcon as Loader2,
  DocumentTextIcon as FileText,
  SparklesIcon as Sparkles,
} from '@heroicons/react/24/outline';
import type { SystemPrompt } from './GenerativeAIModal';

interface GenerativeAIPromptPickerProps {
  categories: string[];
  selectedCategory: string;
  selectedPrompt: SystemPrompt | null;
  filteredPrompts: SystemPrompt[];
  isLoadingPrompts: boolean;
  onCategoryChange: (category: string) => void;
  onPromptSelect: (prompt: SystemPrompt) => void;
}

export function GenerativeAIPromptPicker({
  categories,
  selectedCategory,
  selectedPrompt,
  filteredPrompts,
  isLoadingPrompts,
  onCategoryChange,
  onPromptSelect,
}: GenerativeAIPromptPickerProps) {
  return (
    <div className="w-1/3 flex flex-col border-r pr-6 min-h-0">
      <div className="mb-4">
        <label className="text-sm font-medium mb-2 block">Filter by Category</label>
        <select
          value={selectedCategory}
          onChange={(event) => onCategoryChange(event.target.value)}
          className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
        >
          <option value="all">All Categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3">
        {isLoadingPrompts ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : filteredPrompts.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No system prompts found</p>
          </div>
        ) : (
          filteredPrompts.map((prompt) => (
            <Card
              key={prompt.id}
              className={`cursor-pointer transition-all hover:shadow-md ${selectedPrompt?.id === prompt.id
                ? 'ring-2 ring-primary bg-primary/10 border-primary'
                : ''
                }`}
              onClick={() => onPromptSelect(prompt)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Sparkles className="h-3 w-3 text-primary" />
                      {prompt.name}
                    </CardTitle>
                    <CardDescription className="text-xs mt-1">
                      {prompt.description}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {prompt.categoryName}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-2">
                  <Badge variant={prompt.isActive ? "default" : "secondary"} className="text-xs">
                    {prompt.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
