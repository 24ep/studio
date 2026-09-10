"use client";

import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { sanitizeUrl } from '@/lib/utils';

interface EvaluationActiveHeaderProps {
  applicantName: string;
  appLogoUrl?: string | null;
  textColor: string;
  onBack: () => void;
}

export function EvaluationActiveHeader({
  applicantName,
  appLogoUrl,
  textColor,
  onBack,
}: EvaluationActiveHeaderProps) {
  const textColorStyle = { color: `hsl(${textColor})` };

  return (
    <div className="py-6 flex items-center justify-between px-6 sm:px-10">
      <div className="flex items-center gap-2 sm:gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={onBack}
          className="flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12"
          style={textColorStyle}
        >
          <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" style={textColorStyle} />
        </Button>
        <div>
          <div className="text-xs sm:text-sm uppercase tracking-wide" style={textColorStyle}>Applicant</div>
          <h1 className="text-xl sm:text-3xl font-semibold leading-tight" style={textColorStyle}>
            {applicantName}
          </h1>
        </div>
      </div>
      {appLogoUrl && (
        <div className="relative h-8 w-20 sm:h-10 sm:w-24">
          <Image
            src={sanitizeUrl(appLogoUrl) || ''}
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
