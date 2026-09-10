"use client";

import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { AutoFont } from '@/components/ui/auto-font';

interface EvaluateHeaderProps {
  applicantName: string;
  appLogoUrl: string | null;
  evaluateHeaderTextColor: string;
  onBack?: () => void;
  showBackButton?: boolean;
}

export function EvaluateHeader({
  applicantName,
  appLogoUrl,
  evaluateHeaderTextColor,
  onBack,
  showBackButton = false,
}: EvaluateHeaderProps) {
  return (
    <div className="py-6 flex items-center justify-between px-6 sm:px-10">
      <div className="flex items-center gap-2 sm:gap-4">
        {showBackButton && onBack && (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Go back"
            onClick={onBack}
            className="flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 border-none shadow-none hover:bg-transparent focus:ring-0"
            style={{ color: `hsl(${evaluateHeaderTextColor})` }}
          >
            <ChevronLeft className="h-6 w-6 sm:h-8 sm:w-8" style={{ color: `hsl(${evaluateHeaderTextColor})` }} />
          </Button>
        )}
        <div>
          <div className="text-xs sm:text-sm uppercase tracking-wide" style={{ color: `hsl(${evaluateHeaderTextColor})` }}>Applicant</div>
          <AutoFont asChild><h1 className="text-xl sm:text-3xl font-semibold leading-tight" style={{ color: `hsl(${evaluateHeaderTextColor})` }}>{applicantName}</h1></AutoFont>
        </div>
      </div>
      {appLogoUrl && (
        <div className="relative h-8 w-20 sm:h-10 sm:w-24">
          <Image
            src={appLogoUrl}
            alt="App Logo"
            fill
            unoptimized
            sizes="(max-width: 640px) 80px, 96px"
            className="object-contain"
          />
        </div>
      )}
    </div>
  );
}

