"use client";

import { Pin as PinIcon } from 'lucide-react';

import { Card } from '@/components/ui/card';
import type { Applicant } from '@/lib/types';

export function InvalidApplicantCard() {
  return (
    <Card className="p-4 border border-destructive/20 bg-destructive/5">
      <div className="text-center text-destructive text-sm">
        Invalid Applicant data
      </div>
    </Card>
  );
}

export function ApplicantCardStatusIndicator({
  applicant,
  isUnread,
}: {
  applicant: Applicant;
  isUnread: boolean;
}) {
  if (applicant.isPinned) {
    return (
      <div className="absolute top-2 right-2">
        <PinIcon className="h-4 w-4 text-amber-500 fill-current rotate-45" />
      </div>
    );
  }

  if (!isUnread || applicant.isBlacklisted) return null;

  return (
    <div className="absolute top-2 right-2">
      <div className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
    </div>
  );
}
