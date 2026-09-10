"use client";

import Image from 'next/image';
import { format } from 'date-fns';

interface ReportBrandHeaderProps {
  organizationLogoUrl: string | null;
  organizationName: string | null;
  appLogoUrl: string | null;
}

export function ReportBrandHeader({
  organizationLogoUrl,
  organizationName,
  appLogoUrl,
}: ReportBrandHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div className="flex items-center gap-4">
        {organizationLogoUrl && (
          <>
            <div className="relative h-8 w-24">
              <Image
                src={organizationLogoUrl}
                alt="Organization Logo"
                fill
                unoptimized
                sizes="96px"
                className="object-contain"
              />
            </div>
            {organizationName && <span className="text-gray-400">|</span>}
          </>
        )}
        {organizationName && (
          <span className="text-lg font-semibold text-gray-900">{organizationName}</span>
        )}
        {appLogoUrl && (
          <>
            <span className="text-gray-400">|</span>
            <div className="relative h-12 w-28">
              <Image
                src={appLogoUrl}
                alt="Application Logo"
                fill
                unoptimized
                sizes="112px"
                className="object-contain"
              />
            </div>
          </>
        )}
      </div>
      <div className="hidden sm:flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm text-gray-500 mb-1">Report Date</p>
          <p className="text-base font-semibold text-gray-900">
            {format(new Date(), 'MMMM dd, yyyy')}
          </p>
        </div>
      </div>
    </div>
  );
}
