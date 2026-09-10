"use client";

import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { FunnelIcon as FilterX } from '@heroicons/react/24/outline';

interface ApplicantFilterSectionHeaderProps {
  icon: ReactNode;
  title: string;
  disabled?: boolean;
  onReset: () => void;
  children?: ReactNode;
}

export function ApplicantFilterSectionHeader({
  icon,
  title,
  disabled,
  onReset,
  children,
}: ApplicantFilterSectionHeaderProps) {
  return (
    <div className="flex items-center justify-between w-full pr-2">
      <div className="flex items-center gap-2">
        {icon}
        <h4 className="text-sm font-semibold">{title}</h4>
        {children}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={(event) => {
          event.stopPropagation();
          onReset();
        }}
        disabled={disabled}
        className="h-6 w-6 p-0 hover:bg-muted/50"
      >
        <FilterX className="h-3 w-3" />
      </Button>
    </div>
  );
}
