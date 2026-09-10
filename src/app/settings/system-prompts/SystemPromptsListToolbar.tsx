"use client";

import type { Dispatch, SetStateAction } from "react";
import { DownloadCloud, Loader2, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SystemPromptCategory } from "./types";

interface SystemPromptsListToolbarProps {
  categories: SystemPromptCategory[];
  isImportingAppKit?: {
    environment: "development" | "production";
    percent: number;
    message: string;
  } | null;
  onCreatePrompt: () => void;
  onLoadFromAppKit?: (environment: "development" | "production") => void;
  searchTerm: string;
  selectedCategory: string;
  setSearchTerm: Dispatch<SetStateAction<string>>;
  setSelectedCategory: Dispatch<SetStateAction<string>>;
}

export function SystemPromptsListToolbar({
  categories,
  isImportingAppKit = null,
  onCreatePrompt,
  onLoadFromAppKit,
  searchTerm,
  selectedCategory,
  setSearchTerm,
  setSelectedCategory,
}: SystemPromptsListToolbarProps) {
  const isLoading = !!isImportingAppKit;
  const loadingForDevelopment =
    isImportingAppKit && isImportingAppKit.environment === "development" ? isImportingAppKit : null;
  const loadingForProduction =
    isImportingAppKit && isImportingAppKit.environment === "production" ? isImportingAppKit : null;
  return (
    <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
      <div className="flex gap-4 flex-1">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search prompts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="w-48 mr-4">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.name}>{category.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {onLoadFromAppKit && (
          <>
            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              onClick={() => onLoadFromAppKit("development")}
              className="flex items-center gap-2"
            >
              {loadingForDevelopment ? <Loader2 className="h-4 w-4 animate-spin" /> : <DownloadCloud className="h-4 w-4" />}
              {loadingForDevelopment
                ? `${loadingForDevelopment.percent}% · ${loadingForDevelopment.message}`
                : "Load development prompts"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              onClick={() => onLoadFromAppKit("production")}
              className="flex items-center gap-2"
            >
              {loadingForProduction ? <Loader2 className="h-4 w-4 animate-spin" /> : <DownloadCloud className="h-4 w-4" />}
              {loadingForProduction
                ? `${loadingForProduction.percent}% · ${loadingForProduction.message}`
                : "Load live prompts"}
            </Button>
          </>
        )}
        <Button
          onClick={onCreatePrompt}
          className="flex items-center gap-2"
          disabled={categories.length === 0}
          title={categories.length === 0 ? "Create at least one category first" : ""}
        >
          <Plus className="h-4 w-4" />
          Create Prompt
        </Button>
      </div>
    </div>
  );
}
