"use client";

import { Dispatch, SetStateAction } from 'react';
import { Edit, Loader2, Plus, Search, Tag, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { SystemPromptCategory } from './types';

interface SystemPromptCategoriesTabProps {
  isLoading: boolean;
  categorySearchTerm: string;
  setCategorySearchTerm: Dispatch<SetStateAction<string>>;
  filteredCategories: SystemPromptCategory[];
  onCreateCategory: () => void;
  onEditCategory: (category: SystemPromptCategory) => void;
  onDeleteCategory: (id: string) => void;
}

export function SystemPromptCategoriesTab({
  isLoading,
  categorySearchTerm,
  setCategorySearchTerm,
  filteredCategories,
  onCreateCategory,
  onEditCategory,
  onDeleteCategory,
}: SystemPromptCategoriesTabProps) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-6 flex flex-shrink-0 items-center justify-between">
        <div className="max-w-md flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
            <Input
              placeholder="Search categories..."
              value={categorySearchTerm}
              onChange={(e) => setCategorySearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Button onClick={onCreateCategory} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Category
        </Button>
      </div>

      <ScrollArea className="min-h-0 flex-1 pr-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="text-center py-12">
            <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No categories found</h3>
            <p className="text-muted-foreground mb-4">
              {categorySearchTerm
                ? 'Try adjusting your search criteria.'
                : 'Create your first category to get started.'
              }
            </p>
            {!categorySearchTerm && (
              <Button onClick={onCreateCategory}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Category
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCategories.map((category) => (
              <Card key={category.id} className="ai-prompt-library-card group transition-shadow hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        {category.name}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {category.description || 'No description'}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditCategory(category)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteCategory(category.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={category.isActive ? "default" : "secondary"}>
                        {category.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>Updated: {new Date(category.updatedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
