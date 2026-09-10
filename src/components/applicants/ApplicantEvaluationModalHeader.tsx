"use client";

import {
  BriefcaseIcon as Briefcase,
  EnvelopeIcon as Mail,
} from '@heroicons/react/24/outline';
import type { Applicant, Position } from '@/lib/types';

export function ApplicantEvaluationHeader({
  applicant,
  position,
}: {
  applicant: Applicant;
  position?: Position;
}) {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex-shrink-0">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{applicant.name}</h2>
          <div className="text-blue-100 text-sm mt-1">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                {applicant.email}
              </span>
              {position && (
                <span className="flex items-center gap-1">
                  <Briefcase className="h-4 w-4" />
                  {position.title}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-blue-100">hrive</div>
        </div>
      </div>
    </div>
  );
}
