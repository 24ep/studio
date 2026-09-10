"use client";

import {
  CpuChipIcon as Brain,
  LightBulbIcon as Lightbulb,
  XMarkIcon as X,
} from "@heroicons/react/24/outline";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { ApplicantFilterSectionHeader } from "./ApplicantFilterSectionHeader";

interface ApplicantAiPowerSearchSectionProps {
  query: string;
  isLoading?: boolean;
  isAiSearching?: boolean;
  onQueryChange: (query: string) => void;
  onSearch: () => void;
  onCancelSearch?: () => void;
  onReset: () => void;
}

export function ApplicantAiPowerSearchSection({
  query,
  isLoading,
  isAiSearching,
  onQueryChange,
  onSearch,
  onCancelSearch,
  onReset,
}: ApplicantAiPowerSearchSectionProps) {
  const isSearchDisabled = !isAiSearching && (!query.trim() || isLoading);

  return (
    <Accordion type="multiple" defaultValue={["ai-power-search"]} className="w-full">
      <AccordionItem value="ai-power-search" className="border-b border-border/50">
        <AccordionTrigger className="px-6 py-3 hover:no-underline rounded-none pl-6 pr-6 pr-6">
          <ApplicantFilterSectionHeader
            icon={isAiSearching ? (
              <div className="relative">
                <Brain className="w-4 h-4 text-blue-600 animate-pulse" />
                <div className="absolute inset-0 w-4 h-4 border-2 border-blue-300 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <Brain className="w-4 h-4 text-muted-foreground" />
            )}
            title="AI Power Search"
            onReset={onReset}
            disabled={isLoading || isAiSearching}
          >
            <Lightbulb className={cn("w-4 h-4", isAiSearching ? "text-blue-500 animate-pulse" : "text-muted-foreground")} />
          </ApplicantFilterSectionHeader>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4">
          <div className="flex flex-col gap-3">
            <div className="space-y-2">
              <Label htmlFor="ai-search" className="text-xs font-medium">Search Query</Label>
              <div className="relative">
                <Textarea
                  id="ai-search"
                  placeholder="e.g., 'React developers with 5+ years experience at tech companies'"
                  value={query}
                  onChange={(event) => onQueryChange(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
                      return;
                    }

                    if (event.key === "Enter") {
                      event.preventDefault();
                      if (query.trim() && !isLoading && !isAiSearching) {
                        onSearch();
                      }
                    }
                  }}
                  className={cn("min-h-[80px] text-base transition-all duration-300", isAiSearching && "border-primary/50 bg-primary/5 dark:bg-primary/10")}
                  disabled={isLoading || isAiSearching}
                />
                {isAiSearching && (
                  <div className="absolute top-2 right-2">
                    <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-3">
              <Button
                onClick={isAiSearching ? onCancelSearch : onSearch}
                disabled={isSearchDisabled}
                className={cn("w-full transition-all duration-300", isAiSearching && "bg-red-600 hover:bg-red-700 shadow-lg")}
                size="sm"
              >
                {isAiSearching ? (
                  <>
                    <X className="mr-2 h-4 w-4" />
                    Cancel Search
                  </>
                ) : (
                  <>
                    <Brain className="mr-2 h-4 w-4" />
                    AI Search
                  </>
                )}
              </Button>

              {isAiSearching && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-primary">
                    <div className="flex space-x-1">
                      <div className="h-2 w-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: "0ms" }} />
                      <div className="h-2 w-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: "150ms" }} />
                      <div className="h-2 w-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: "300ms" }} />
                    </div>
                    <span>Analyzing Applicants with AI...</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                    <div className="bg-primary h-1.5 rounded-full animate-pulse" style={{ width: "60%" }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
