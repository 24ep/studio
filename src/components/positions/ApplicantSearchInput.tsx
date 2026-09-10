"use client";

import { Search, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ApplicantSearchInputProps {
  onSearchChange: (term: string) => void;
  placeholder: string;
  showClear?: boolean;
  value: string;
}

export function ApplicantSearchInput({
  onSearchChange,
  placeholder,
  showClear = false,
  value,
}: ApplicantSearchInputProps) {
  return (
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(event) => onSearchChange(event.target.value)}
        className="pl-10"
      />
      {showClear && value && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
          onClick={() => onSearchChange('')}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
