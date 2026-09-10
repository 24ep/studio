"use client";

import type { ReactNode } from 'react';
import {
  AcademicCapIcon as GraduationCap,
  BriefcaseIcon as Briefcase,
  CircleStackIcon as HardDrive,
} from '@heroicons/react/24/outline';

import { Badge } from '@/components/ui/badge';

import {
  getFieldLabel,
  type ApplicantEducationSummary,
  type ApplicantExperienceSummary,
  type ApplicantSkillSummary,
} from './applicant-kanban-utils';
import { ApplicantFieldRow } from './ApplicantKanbanCardFields';

export function ApplicantEducationSummaryList({
  education,
  visibleFields,
}: {
  education: ApplicantEducationSummary[];
  visibleFields: string[];
}) {
  return (
    <ApplicantSummaryList
      field="education"
      icon={<GraduationCap className="w-3 h-3 mr-1" />}
      items={education}
      visibleFields={visibleFields}
      renderItem={(item) => `${item.major || item.field || 'Degree'}${item.university ? ` at ${item.university}` : ''}`}
    />
  );
}

export function ApplicantExperienceSummaryList({
  experience,
  visibleFields,
}: {
  experience: ApplicantExperienceSummary[];
  visibleFields: string[];
}) {
  return (
    <ApplicantSummaryList
      field="experience"
      icon={<Briefcase className="w-3 h-3 mr-1" />}
      items={experience}
      visibleFields={visibleFields}
      renderItem={(item) => `${item.position || 'Position'}${item.company ? ` at ${item.company}` : ''}`}
    />
  );
}

export function ApplicantSkillsSummary({
  skills,
  visibleFields,
}: {
  skills: ApplicantSkillSummary[];
  visibleFields: string[];
}) {
  if (!visibleFields.includes('skills') || skills.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1">
      <ApplicantFieldRow icon={<HardDrive className="w-3 h-3 mr-1" />}>
        <span className="font-medium">{getFieldLabel('skills')}:</span>
      </ApplicantFieldRow>
      <div className="flex flex-wrap gap-1 pl-4">
        {skills.slice(0, 3).map((skill, index) => (
          <Badge key={`${skill.skill_string ?? skill.segment_skill ?? 'skill'}-${index}`} variant="outline" className="text-xs px-1 py-0">
            {skill.skill_string || skill.segment_skill || 'Skill'}
          </Badge>
        ))}
        {skills.length > 3 && (
          <Badge variant="outline" className="text-xs px-1 py-0">
            +{skills.length - 3}
          </Badge>
        )}
      </div>
    </div>
  );
}

function ApplicantSummaryList({
  field,
  icon,
  items,
  visibleFields,
  renderItem,
}: {
  field: string;
  icon: ReactNode;
  items: Array<ApplicantEducationSummary | ApplicantExperienceSummary>;
  visibleFields: string[];
  renderItem: (item: ApplicantEducationSummary | ApplicantExperienceSummary) => string;
}) {
  if (!visibleFields.includes(field) || items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1">
      <ApplicantFieldRow icon={icon}>
        <span className="font-medium">{getFieldLabel(field)}:</span>
      </ApplicantFieldRow>
      <div className="text-xs text-muted-foreground pl-4">
        {items.slice(0, 2).map((item, index) => (
          <div key={`${renderItem(item)}-${index}`} className="truncate">
            {renderItem(item)}
          </div>
        ))}
        {items.length > 2 && (
          <div className="text-xs text-muted-foreground/60">+{items.length - 2} more</div>
        )}
      </div>
    </div>
  );
}
