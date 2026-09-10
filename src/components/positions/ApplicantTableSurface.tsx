"use client";

import type { ReactNode } from 'react';

import { ScrollArea } from '@/components/ui/scroll-area';

export function ApplicantTableSurface({
  children,
  isMobile,
}: {
  children: ReactNode;
  isMobile: boolean;
}) {
  return (
    <div className="border rounded-lg flex-1 overflow-hidden">
      <ScrollArea className="h-full">
        <div className={isMobile ? 'pb-40' : ''}>
          {children}
        </div>
      </ScrollArea>
    </div>
  );
}
