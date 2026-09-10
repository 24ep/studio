"use client";

import React from 'react';
import { Ban } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BlacklistBadgeProps {
  className?: string;
  iconClassName?: string;
}

/**
 * Standardized badge for indicating a Applicant is blacklisted.
 * Follows the existing destructive style (red background, white text).
 */
export const BlacklistBadge: React.FC<BlacklistBadgeProps> = ({ 
  className,
  iconClassName 
}) => {
  return (
    <div className={cn(
      "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80 shrink-0",
      className
    )}>
      <Ban className={cn("mr-1 h-3 w-3", iconClassName)} />
      Blacklisted
    </div>
  );
};
