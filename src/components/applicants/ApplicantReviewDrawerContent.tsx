"use client";

import { useEffect, useState } from "react";
import {
  AcademicCapIcon,
  BuildingOffice2Icon,
  BriefcaseIcon,
  CheckCircleIcon,
  SparklesIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { convertMinIOUrlToSecureUrl } from "@/lib/imageUtils";
import { cn } from "@/lib/utils";
import type { Applicant } from "@/lib/types";
import ApplicantCommentsSection from "./ApplicantCommentsSection";
import { ApplicantInfoDisplayCard } from "./tabs/ApplicantInfoDisplayCard";
import ApplicantResumesSection from "./ApplicantResumesSection";
import { EvaluateReportSection } from "./evaluate-report/EvaluateReportSection";
import { getJobAppliedJustificationTone } from "./tabs/job-applied-tab-utils";
import {
  calculateTotalExperienceDuration,
  getExperienceDisplayCompanyLogo,
  getExperienceDisplayCompanyName,
} from "./applicant-experience-utils";
import type { FullApplicantDetailController } from "./use-full-applicant-detail-controller";

type ReviewTab = "overview" | "personal" | "resume" | "activity" | "evaluations";
type LoadedController = FullApplicantDetailController & { applicant: Applicant };

const reviewTabs: Array<{ id: ReviewTab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "personal", label: "Personal info" },
  { id: "resume", label: "Resume" },
  { id: "activity", label: "Activity" },
  { id: "evaluations", label: "Evaluations" },
];

export function ApplicantReviewDrawerContent({
  controller,
}: {
  controller: LoadedController;
}) {
  const [activeTab, setActiveTab] = useState<ReviewTab>("overview");

  useEffect(() => {
    if (controller.profileEditRequestKey > 0) setActiveTab("personal");
  }, [controller.profileEditRequestKey]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-white text-[#12213d]">
      <nav
        aria-label="Applicant review sections"
        className="flex h-[50px] shrink-0 items-center gap-8 border-b border-[#e2e7ef] px-5"
      >
        {reviewTabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            aria-current={activeTab === tab.id ? "page" : undefined}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "relative flex h-full items-center text-[14px] font-medium text-[#526079] outline-none transition-colors hover:text-[#12213d] focus-visible:outline-none focus-visible:ring-0",
              activeTab === tab.id && "font-semibold text-[#0b63e6] after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-[#0b63e6]",
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="min-h-0 flex-1 overflow-y-auto bg-white">
        {activeTab === "overview" && (
          <ApplicantReviewOverview
            applicant={controller.applicant}
            aiJustifications={controller.appliedJustification}
          />
        )}
        {activeTab === "personal" && (
          <div className="px-7 py-[26px]">
            <ApplicantInfoDisplayCard
              applicant={controller.applicant}
              editable
              editRequestKey={controller.profileEditRequestKey}
              onApplicantChange={controller.setApplicant}
              onRefresh={controller.onRefresh}
            />
          </div>
        )}
        {activeTab === "resume" && (
          <ApplicantResumesSection
            applicantId={controller.applicant.id}
            resumes={controller.resumes}
            isEditing={controller.isEditing}
            onResumesChange={controller.onRefresh}
          />
        )}
        {activeTab === "activity" && (
          <ApplicantCommentsSection
            applicantId={controller.applicant.id}
            comments={controller.comments}
            isEditing={controller.isEditing}
            onCommentsChange={controller.onRefresh}
          />
        )}
        {activeTab === "evaluations" && (
          <EvaluateReportSection applicantId={controller.applicant.id} isEmbedded />
        )}
      </div>
    </div>
  );
}

function ApplicantReviewOverview({
  applicant,
  aiJustifications,
}: {
  applicant: Applicant;
  aiJustifications: string[];
}) {
  const parsed = asRecord(applicant.parsedData);
  const skills = extractSkills(parsed);
  const allExperiences = applicant.experienceData || [];
  const experiences = allExperiences.slice(0, 3);
  const totalExperienceDuration = calculateTotalExperienceDuration(allExperiences);
  const education = (applicant.educationData || []).slice(0, 2);
  const summary = firstText(
    parsed.professional_summary,
    parsed.summary,
    parsed.introduction_aboutme,
  );

  return (
    <div className="space-y-[28px] px-7 py-[26px] text-[#263451]">
      <section className="grid grid-cols-[84px_minmax(0,1fr)] gap-5">
        <div className="border-r border-[#e2e7ef] pr-5">
          <p className="text-[11px] font-medium text-[#68758e]">Fit score</p>
          <div className="mt-1 flex items-baseline gap-1.5 text-[#08aeb0]">
            <span className="text-[28px] font-bold tracking-[-0.04em]">{applicant.fitScore}</span>
            <span className="text-[11px] font-bold">{fitGrade(applicant.fitScore)}</span>
          </div>
        </div>
        <div>
          <h3 className="flex items-center gap-2 text-[14px] font-semibold text-[#12213d]">
            <SparklesIcon className="h-5 w-5 text-[#08b5b6]" aria-hidden="true" />
            AI fit summary
          </h3>
          {aiJustifications.length ? (
            <div className="mt-2 divide-y divide-[#e5e9ef]">
              {aiJustifications.map((sentence, index) => {
                const isNegative = getJobAppliedJustificationTone(sentence) === "negative";
                const EvidenceIcon = isNegative ? XCircleIcon : CheckCircleIcon;

                return (
                  <div key={`${sentence}-${index}`} className="flex items-start gap-2.5 py-2 first:pt-0">
                    <EvidenceIcon className={`mt-0.5 h-4 w-4 shrink-0 ${isNegative ? "text-rose-500" : "text-emerald-600"}`} aria-hidden="true" />
                    <p className="text-[13px] leading-5 text-[#33425f]">{sentence}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-1.5 max-w-3xl text-[13px] leading-5 text-[#33425f]">
              {summary || "No AI match justification is available yet."}
            </p>
          )}
        </div>
      </section>

      <section>
        <h3 className="text-[14px] font-semibold text-[#12213d]">Top skills</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {(skills.length ? skills.slice(0, 8) : ["Skills not provided"]).map(skill => (
            <span key={skill} className="rounded-full bg-[#f0f2f5] px-3.5 py-1.5 text-[12px] font-medium leading-4 text-[#263451]">
              {skill}
            </span>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2">
          <BriefcaseIcon className="h-5 w-5 text-[#61708b]" aria-hidden="true" />
          <h3 className="text-[14px] font-semibold text-[#12213d]">Experience</h3>
          {totalExperienceDuration && (
            <span className="text-[12px] font-medium text-[#68758e]">
              ({totalExperienceDuration})
            </span>
          )}
        </div>
        <div className="mt-3 space-y-5">
          {experiences.length ? experiences.map((experience, index) => (
            <article key={experience.id || `${experience.company}-${index}`} className="grid grid-cols-[22px_minmax(0,1fr)] gap-4">
              <div className="relative flex justify-center">
                {index < experiences.length - 1 && (
                  <span className="absolute bottom-[-20px] top-5 w-px bg-[#d9e0ea]" aria-hidden="true" />
                )}
                <span
                  className={cn(
                    "relative z-10 mt-1 h-3 w-3 rounded-full border-2 bg-white",
                    index === 0 ? "border-[#1769e8]" : "border-[#b9c1ce]",
                  )}
                  aria-hidden="true"
                />
              </div>
              <div>
              <h4 className="text-[13px] font-semibold text-[#12213d]">{experience.position || "Position not provided"}</h4>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[13px] text-[#3d4c68]">
                <ExperienceCompanyIdentity experience={experience} />
                {experience.companyReference?.country && (
                  <><span aria-hidden="true">•</span><span>{experience.companyReference.country}</span></>
                )}
              </p>
              <p className="mt-0.5 text-[13px] text-[#536079]">
                {formatPeriod(experience.startMonth, experience.startYear, experience.endMonth, experience.endYear, experience.isCurrent)}
                {experience.duration ? ` (${experience.duration})` : ""}
              </p>
                {experience.description && <p className="mt-1 text-[13px] leading-5 text-[#33425f]">{experience.description}</p>}
              </div>
            </article>
          )) : <EmptyLine text="No experience has been added yet." />}
        </div>
      </section>

      <section className="grid grid-cols-[28px_minmax(0,1fr)] gap-[10px]">
        <AcademicCapIcon className="mt-0.5 h-5 w-5 text-[#61708b]" aria-hidden="true" />
        <div>
          <h3 className="text-[14px] font-semibold text-[#12213d]">Education</h3>
          <div className="mt-2 space-y-4">
            {education.length ? education.map((item, index) => (
              <article key={item.id || `${item.university}-${index}`}>
                <h4 className="text-[13px] font-semibold text-[#12213d]">{item.major || item.field || "Qualification"}</h4>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[13px] text-[#3d4c68]">
                  <span>{item.university || "Institution not provided"}</span>
                  {item.campus && <><span aria-hidden="true">•</span><span>{item.campus}</span></>}
                </p>
                <p className="mt-0.5 text-[13px] text-[#536079]">
                  {formatPeriod(item.startMonth, item.startYear, item.endMonth, item.endYear, item.isCurrent)}
                  {item.duration ? ` (${item.duration})` : ""}
                </p>
              </article>
            )) : <EmptyLine text="No education has been added yet." />}
          </div>
        </div>
      </section>
    </div>
  );
}

function ExperienceCompanyIdentity({
  experience,
}: {
  experience: NonNullable<Applicant["experienceData"]>[number];
}) {
  const company = getExperienceDisplayCompanyName(experience) || "Company not provided";
  const logo = getExperienceDisplayCompanyLogo(experience);
  const imageUrl = logo
    ? convertMinIOUrlToSecureUrl(logo, { thumbnail: true, width: 24, height: 24 }) || logo
    : null;

  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <Avatar className="h-6 w-6 shrink-0 rounded-md bg-[#f1f4f8]">
        {imageUrl ? (
          <AvatarImage
            src={imageUrl}
            alt={`${company} logo`}
            className="h-6 w-6 rounded-md object-contain p-0.5"
          />
        ) : null}
        <AvatarFallback className="h-6 w-6 rounded-md bg-[#eef2f7] text-[#61708b]">
          <BuildingOffice2Icon className="h-4 w-4" aria-hidden="true" />
        </AvatarFallback>
      </Avatar>
      <span className="truncate">{company}</span>
    </span>
  );
}

function fitGrade(score: number) {
  if (score >= 81) return "A";
  if (score >= 61) return "B";
  if (score >= 41) return "C";
  if (score >= 21) return "D";
  return "E";
}

function EmptyLine({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-500">
      <BriefcaseIcon className="h-4 w-4" aria-hidden="true" />
      {text}
    </div>
  );
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function firstText(...values: unknown[]) {
  const value = values.find(item => typeof item === "string" && item.trim());
  return typeof value === "string" ? value : "";
}

function extractSkills(parsed: Record<string, unknown>) {
  const raw = parsed.skills || parsed.skill || parsed.top_skills;
  if (!Array.isArray(raw)) return [];

  return raw.flatMap(item => {
    if (typeof item === "string") return [item];
    const record = asRecord(item);
    if (typeof record.name === "string") return [record.name];
    if (typeof record.segment_skill === "string") return [record.segment_skill];
    if (Array.isArray(record.skill)) return record.skill.filter(value => typeof value === "string") as string[];
    return [];
  });
}

function formatPeriod(
  startMonth?: number,
  startYear?: number,
  endMonth?: number,
  endYear?: number,
  isCurrent?: boolean,
) {
  const month = (value?: number) => value
    ? new Intl.DateTimeFormat(undefined, { month: "short" }).format(new Date(2024, value - 1, 1))
    : "";
  const start = [month(startMonth), startYear].filter(Boolean).join(" ");
  const end = isCurrent ? "Present" : [month(endMonth), endYear].filter(Boolean).join(" ");
  return [start, end].filter(Boolean).join(" – ") || "Dates not provided";
}
