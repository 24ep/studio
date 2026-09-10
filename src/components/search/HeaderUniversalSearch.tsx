"use client";

import { HeaderSearchDropdown, HeaderSearchInput } from "./HeaderUniversalSearchParts";
import { useHeaderUniversalSearch } from "./use-header-universal-search";

interface HeaderUniversalSearchProps {
  placeholder: string;
}

export function HeaderUniversalSearch({ placeholder }: HeaderUniversalSearchProps) {
  const search = useHeaderUniversalSearch();

  return (
    <div ref={search.containerRef} className="relative w-full group">
      <HeaderSearchInput
        placeholder={placeholder}
        query={search.query}
        onClear={search.clearSearch}
        onFocus={() => search.setOpen(true)}
        onQueryChange={search.handleQueryChange}
      />

      {search.open && (
        <HeaderSearchDropdown
          flatResults={search.flatResults}
          loading={search.loading}
          query={search.query}
          onSelect={search.handleSelect}
        />
      )}
    </div>
  );
}
