"use client";

import type { ChangeEvent, RefObject } from 'react';
import {
  ArrowPathIcon as Loader2,
  CameraIcon as Camera,
} from '@heroicons/react/24/outline';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { Applicant, Position } from '@/lib/types';

interface ReportApplicantAvatarProps {
  applicant: Applicant;
  canEditApplicantBasic: () => boolean;
  avatarUploading: boolean;
  avatarInputRef: RefObject<HTMLInputElement>;
  handleAvatarUpload: (file: File) => Promise<void>;
}

interface ReportApplicantSummaryProps {
  applicant: Applicant;
  position: Position | null;
}

export function ReportApplicantAvatar({
  applicant,
  canEditApplicantBasic,
  avatarUploading,
  avatarInputRef,
  handleAvatarUpload,
}: ReportApplicantAvatarProps) {
  const handleInputChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await handleAvatarUpload(file);
    }
    event.target.value = '';
  };

  return (
    <div className="relative hidden sm:block">
      <Avatar className="h-20 w-20 border-none ring-0 outline-none shadow-none">
        <AvatarImage src={applicant.avatarUrl || undefined} alt={applicant.name} />
        <AvatarFallback className="bg-gray-200 text-gray-700 text-2xl font-semibold">
          {applicant.name?.charAt(0)?.toUpperCase() || 'C'}
        </AvatarFallback>
      </Avatar>
      {canEditApplicantBasic() && (
        <>
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            className="absolute bottom-0 right-0 p-1.5 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors no-print"
            title="Change avatar"
            disabled={avatarUploading}
          >
            {avatarUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
          </button>
          <input
            type="file"
            accept="image/*"
            ref={avatarInputRef}
            style={{ display: 'none' }}
            onChange={handleInputChange}
            tabIndex={-1}
            aria-hidden="true"
          />
        </>
      )}
    </div>
  );
}

export function ReportApplicantSummary({
  applicant,
  position,
}: ReportApplicantSummaryProps) {
  return (
    <div className="flex-1">
      <h2 className="text-3xl font-semibold text-gray-900 mb-2">{applicant.name}</h2>
      {position && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-base font-medium text-gray-900">{position.title}</span>
          {position.grade && (
            <>
              <span className="text-gray-400">|</span>
              <Badge
                className="text-sm"
                style={{
                  backgroundColor: position.grade.color || '#3B82F6',
                  color: 'white',
                }}
              >
                {position.grade.label || position.grade.name}
              </Badge>
            </>
          )}
        </div>
      )}
    </div>
  );
}
