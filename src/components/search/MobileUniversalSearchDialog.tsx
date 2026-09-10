"use client";

import * as React from "react";
import { Search } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { HeaderSearchDropdown, HeaderSearchInput } from "./HeaderUniversalSearchParts";
import { useHeaderUniversalSearch } from "./use-header-universal-search";

export function MobileUniversalSearchDialog({
  open,
  onOpenChange,
  placeholder,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  placeholder: string;
}) {
  const search = useHeaderUniversalSearch();

  React.useEffect(() => {
    search.setOpen(open);
  }, [open, search.setOpen]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-2 flex max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-xl translate-y-0 flex-col gap-4 overflow-hidden rounded-2xl p-4 sm:top-1/2 sm:-translate-y-1/2">
        <DialogHeader className="pr-8 text-left">
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" aria-hidden="true" />
            Search everything
          </DialogTitle>
          <DialogDescription>Find people, tasks, requests, payroll, and settings.</DialogDescription>
        </DialogHeader>
        <div ref={search.containerRef} className="group relative w-full">
          <HeaderSearchInput
            autoFocus
            inputId="mobile-header-search-input"
            placeholder={placeholder}
            query={search.query}
            onClear={search.clearSearch}
            onFocus={() => search.setOpen(true)}
            onQueryChange={search.handleQueryChange}
          />
        </div>
        <HeaderSearchDropdown
          flatResults={search.flatResults}
          loading={search.loading}
          query={search.query}
          presentation="inline"
          onSelect={(result) => {
            search.handleSelect(result);
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
