"use client";

import * as React from "react";
import {
  AcademicCapIcon,
  BriefcaseIcon,
  IdentificationIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

import ApplicantEducation from "@/components/applicants/ApplicantEducation";
import ApplicantExperience from "@/components/applicants/ApplicantExperience";
import { Badge } from "@/components/ui/badge";
import type { HrCrudRecord } from "@/lib/hr/hr-crud";
import type { EducationEntry, ExperienceEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

export type PersonProfileTab = "personal" | "experience" | "education" | "skills";
type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as UnknownRecord
    : null;
}

function recordArray<T>(value: unknown): T[] {
  return Array.isArray(value)
    ? value.filter(item => asRecord(item)) as T[]
    : [];
}

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function RequiredIndicator() {
  return <span className="ml-1 text-destructive" title="Required" aria-label="Required">*</span>;
}

function profileValue(profile: UnknownRecord | null, camelKey: string, snakeKey: string) {
  return profile?.[camelKey] ?? profile?.[snakeKey];
}

function getSharedProfile(employee: HrCrudRecord) {
  const profile = asRecord(employee.personProfile);
  const applicant = asRecord(employee.applicant);
  const parsedData = asRecord(applicant?.parsedData);

  return {
    profile,
    firstName: text(profileValue(profile, "firstName", "first_name")) || text(employee.firstName),
    lastName: text(profileValue(profile, "lastName", "last_name")) || text(employee.lastName),
    preferredName: text(profileValue(profile, "preferredName", "preferred_name")) || text(employee.preferredName),
    email: text(profile?.email),
    phone: text(profile?.phone) || text(employee.phone),
    location: text(profile?.location) || text(employee.location),
    introduction: text(profile?.introduction),
    education: recordArray<EducationEntry>(
      profile?.education ?? applicant?.educationData ?? parsedData?.education,
    ),
    experience: recordArray<ExperienceEntry>(
      profileValue(profile, "workExperience", "work_experience")
      ?? applicant?.experienceData
      ?? parsedData?.experience,
    ),
    skills: recordArray<UnknownRecord>(profile?.skills ?? parsedData?.skills),
  };
}

function PersonalDetails({ employee }: { employee: HrCrudRecord }) {
  const person = getSharedProfile(employee);
  const fields = [
    ["Legal name", [person.firstName, person.lastName].filter(Boolean).join(" ")],
    ["Preferred name", person.preferredName],
    ["Personal email", person.email],
    ["Phone", person.phone],
    ["Location", person.location],
    ["About", person.introduction],
  ];

  return (
    <dl>
      {fields.map(([label, value]) => (
        <div
          key={label}
          className="grid gap-1.5 border-b border-border/50 py-2.5 last:border-b-0 md:grid-cols-[minmax(140px,180px)_minmax(0,1fr)] md:items-start md:gap-5"
        >
          <dt className="pt-1.5 text-sm font-medium text-foreground">{label === "Legal name" ? <>{label}<RequiredIndicator /></> : label}</dt>
          <dd className="min-h-8 break-words px-3 py-1.5 text-sm font-semibold text-foreground whitespace-pre-wrap">
            {value || "Not set"}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function SkillsPanel({ employee }: { employee: HrCrudRecord }) {
  const skills = getSharedProfile(employee).skills;

  if (skills.length === 0) {
    return (
      <div className="flex min-h-52 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 text-center">
        <SparklesIcon className="h-9 w-9 text-muted-foreground/60" />
        <h3 className="mt-4 text-sm font-semibold text-foreground">No skills recorded</h3>
        <p className="mt-1 text-sm text-muted-foreground">Skills added to the person profile will appear here.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {skills.map((skill, index) => {
        const label = text(skill.skill_string)
          || text(skill.name)
          || text(skill.label)
          || `Skill ${index + 1}`;
        const segment = text(skill.segment_skill) || text(skill.category);
        return (
          <Badge key={`${label}-${index}`} variant="secondary" className="rounded-full px-3 py-1.5">
            {segment ? `${segment}: ` : ""}{label}
          </Badge>
        );
      })}
    </div>
  );
}

export function EmployeeSharedPersonProfileNavigation({
  employee,
  activeTab,
  onTabChange,
}: {
  employee: HrCrudRecord;
  activeTab: PersonProfileTab;
  onTabChange: (tab: PersonProfileTab) => void;
}) {
  const person = getSharedProfile(employee);
  const tabs = [
    { id: "personal" as const, label: "Personal", icon: IdentificationIcon },
    { id: "experience" as const, label: "Experience", icon: BriefcaseIcon, count: person.experience.length },
    { id: "education" as const, label: "Education", icon: AcademicCapIcon, count: person.education.length },
    { id: "skills" as const, label: "Skills", icon: SparklesIcon, count: person.skills.length },
  ];

  return (
    <div className="overflow-x-auto">
        <div role="tablist" aria-label="Employee information sections" className="flex min-w-max gap-2 py-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {"count" in tab ? (
                  <span className={cn(
                    "min-w-5 rounded-full px-1.5 py-0.5 text-center text-[11px] leading-4",
                    active ? "bg-primary-foreground/20 text-primary-foreground" : "bg-background/70 text-muted-foreground",
                  )}>
                    {tab.count}
                  </span>
                ) : null}
              </button>
            );
          })}
      </div>
    </div>
  );
}

export function EmployeeSharedPersonProfile({
  employee,
  activeTab = "personal",
}: {
  employee: HrCrudRecord;
  activeTab?: PersonProfileTab;
}) {
  const person = getSharedProfile(employee);

  return (
    <div className="space-y-6">
      {activeTab === "personal" ? (
        <PersonalDetails employee={employee} />
      ) : activeTab === "experience" ? (
        <ApplicantExperience experience={person.experience} embedded />
      ) : activeTab === "education" ? (
        <ApplicantEducation education={person.education} embedded />
      ) : (
        <SkillsPanel employee={employee} />
      )}
    </div>
  );
}
