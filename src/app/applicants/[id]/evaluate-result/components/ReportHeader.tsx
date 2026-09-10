"use client";

import React, { useRef } from 'react';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, Camera, Users } from 'lucide-react';
import { format } from 'date-fns';
import type { Applicant, Position } from '@/lib/types';
import type { AveragedEvaluationData, EvaluationRecord } from '../types';

interface ReportHeaderProps {
  applicant: Applicant;
  position: Position | null;
  organizationLogoUrl: string | null;
  organizationName: string | null;
  appLogoUrl: string | null;
  averagedEvaluationData: AveragedEvaluationData | null;
  allEvaluations: EvaluationRecord[];
  canEditApplicantBasic: () => boolean;
  avatarUploading: boolean;
  avatarInputRef: React.RefObject<HTMLInputElement>;
  handleAvatarUpload: (file: File) => Promise<void>;
}

export function ReportHeader({
  applicant,
  position,
  organizationLogoUrl,
  organizationName,
  appLogoUrl,
  averagedEvaluationData,
  allEvaluations,
  canEditApplicantBasic,
  avatarUploading,
  avatarInputRef,
  handleAvatarUpload,
}: ReportHeaderProps) {
  return (
    <div className="border-b-2 border-border pb-6 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        {/* Organization and Application Logos */}
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
              {organizationName && <span className="text-muted-foreground/60">|</span>}
            </>
          )}
          {organizationName && (
            <span className="text-lg font-semibold text-foreground">{organizationName}</span>
          )}
          {appLogoUrl && (
            <>
              <span className="text-muted-foreground/60">|</span>
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
            <p className="text-sm text-muted-foreground mb-1">Report Date</p>
            <p className="text-base font-semibold text-foreground">
              {format(new Date(), 'MMMM dd, yyyy')}
            </p>
          </div>
        </div>
      </div>

      {/* Applicant Name */}
      <div className="mb-6 flex items-start gap-4">
        <div className="relative">
          <Avatar className="h-20 w-20">
            <AvatarImage src={applicant.avatarUrl || undefined} alt={applicant.name} />
            <AvatarFallback className="bg-muted text-muted-foreground text-2xl font-semibold">
              {applicant.name?.charAt(0)?.toUpperCase() || 'C'}
            </AvatarFallback>
          </Avatar>
          {canEditApplicantBasic() && (
            <>
              <button type="button"
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
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    await handleAvatarUpload(file);
                  }
                  e.target.value = '';
                }}
                tabIndex={-1}
                aria-hidden="true"
              />
            </>
          )}
        </div>
        <div className="flex-1">
          <h2 className="text-3xl font-semibold text-foreground mb-2">{applicant.name}</h2>
          {/* Position and Grade */}
          {position && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base font-medium text-foreground">{position.title}</span>
              {position.grade && (
                <>
                  <span className="text-muted-foreground/60">|</span>
                  <Badge
                    className="text-sm"
                    style={{
                      backgroundColor: position.grade.color || '#3B82F6',
                      color: 'white'
                    }}
                  >
                    {position.grade.label || position.grade.name}
                  </Badge>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Evaluators Section */}
      {averagedEvaluationData && allEvaluations.length > 0 && (
        <div className="border-t border-border pt-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">
                {averagedEvaluationData.evaluatorCount} {averagedEvaluationData.evaluatorCount === 1 ? 'Evaluator' : 'Evaluators'}
              </span>
            </div>
            <span className="text-muted-foreground/60">|</span>
            <div className="flex items-center gap-3 flex-wrap">
              {Array.from(new Map(allEvaluations.map(e => [e.evaluator?.id, e.evaluator])).values())
                .filter(e => e)
                .map((evaluator, idx) => (
                  <div key={evaluator?.id || idx} className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={evaluator?.avatarUrl || evaluator?.image || undefined} alt={evaluator?.name || ''} />
                      <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                        {evaluator?.name?.charAt(0)?.toUpperCase() || 'E'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm text-foreground font-medium">{evaluator?.name || 'Unknown'}</span>
                      {evaluator?.positionTitle && (
                        <span className="text-xs text-muted-foreground">{evaluator.positionTitle}</span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

