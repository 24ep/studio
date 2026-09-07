"use client";

import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import {
  AcademicCapIcon,
  ArrowRightIcon,
  BookOpenIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClockIcon,
  MapPinIcon,
  RectangleGroupIcon,
  TrophyIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  buildAchievementViewModel,
  type AchievementSkillArea,
} from "./achievement-view-model";
import type {
  CareerSnapshot,
  LearningRecord,
} from "./learning-workspace-model";

const skillIcons = [
  UserGroupIcon,
  ChartBarIcon,
  MapPinIcon,
  AcademicCapIcon,
  RectangleGroupIcon,
];

export function AchievementJourney({
  courses,
  enrollments,
  certificates,
  career,
}: {
  courses: LearningRecord[];
  enrollments: LearningRecord[];
  certificates: LearningRecord[];
  career: CareerSnapshot | null;
}) {
  const [showRequirements, setShowRequirements] = React.useState(false);
  const [showRecommendationReason, setShowRecommendationReason] =
    React.useState(false);
  const model = buildAchievementViewModel({
    courses,
    enrollments,
    certificates,
    career,
  });

  const roleStops = [
    {
      eyebrow: "Current role",
      title: model.currentRoleTitle,
      value: model.currentReadiness,
      icon: CheckCircleIcon,
      offset: "lg:translate-y-12",
    },
    {
      eyebrow: "Development step",
      title: model.intermediateRoleTitle,
      value: model.nextReadiness,
      icon: MapPinIcon,
      offset: "lg:-translate-y-2",
    },
    {
      eyebrow: "Career goal",
      title: model.targetRoleTitle,
      value: model.targetReadiness,
      icon: TrophyIcon,
      offset: "lg:-translate-y-28",
    },
  ];

  return (
    <div
      data-no-localize
      className="min-h-full bg-[#fbfaf6] text-[#15213a] dark:bg-[#151924] dark:text-[#f5f3ed]"
    >
      <section className="relative min-h-[760px] overflow-hidden border-b border-[#dedbd2] dark:border-white/10 sm:min-h-[455px]">
        <div
          aria-hidden="true"
          className="absolute inset-y-0 right-0 w-full bg-cover bg-center opacity-95 lg:w-[58%]"
          style={{ backgroundImage: "url(/learning/adventure-trail-hero.png)" }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-full bg-[#fbfaf6] dark:bg-[#151924] lg:w-[47%]"
        />

        <div className="relative z-10 px-6 pt-10 lg:px-14">
          <p className="text-sm font-semibold text-[#4f6485] dark:text-zinc-400">
            {new Intl.DateTimeFormat("en", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            }).format(new Date())}
          </p>
          <h1 className="mt-4 text-[clamp(2.5rem,4vw,3.2rem)] font-semibold leading-none tracking-[-.055em]">
            Your career path
          </h1>
          <p className="mt-4 max-w-md text-lg leading-7 text-[#53627a] dark:text-zinc-300">
            Your achievements show you’re building the skills
            <br className="hidden sm:block" /> to take the next step.
          </p>
        </div>

        <div
          aria-hidden="true"
          className="absolute bottom-[88px] left-[10%] right-[13%] z-10 border-t-2 border-dashed border-indigo-500/80 lg:-rotate-[7deg]"
        />
        <div className="relative z-20 mx-auto mt-14 grid max-w-[1220px] gap-5 px-6 sm:grid-cols-3 lg:px-8">
          {roleStops.map((role) => {
            const RoleIcon = role.icon;
            return (
              <article
                key={role.eyebrow}
                className={cn(
                  "relative mx-auto w-full max-w-[205px] rounded-[10px] border border-[#ddd8ce] bg-white p-4 shadow-[0_6px_16px_rgba(37,45,68,.1)] dark:border-white/10 dark:bg-[#202532] sm:mx-0",
                  role.offset,
                )}
              >
                <p className="text-[10px] font-bold uppercase tracking-[.12em] text-indigo-600 dark:text-indigo-300">
                  {role.eyebrow}
                </p>
                <h2 className="mt-1 text-lg font-semibold tracking-[-.025em]">
                  {role.title}
                </h2>
                <p className="mt-2 text-2xl font-semibold text-indigo-600 dark:text-indigo-300">
                  {role.value}%
                </p>
                <p className="mt-1 text-xs text-[#657087] dark:text-zinc-400">
                  Role readiness
                </p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#e7e5df] dark:bg-white/10">
                  <div
                    className="h-full rounded-full bg-indigo-600"
                    style={{ width: `${role.value}%` }}
                  />
                </div>
                <span className="absolute -bottom-14 left-1/2 grid h-9 w-9 -translate-x-1/2 place-items-center rounded-full border-4 border-[#fbfaf6] bg-[#526277] text-white shadow-sm dark:border-[#151924]">
                  <RoleIcon className="h-4 w-4" />
                </span>
              </article>
            );
          })}
        </div>
      </section>

      <section className="grid gap-8 px-6 py-7 lg:px-14 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="min-w-0">
          <div className="flex flex-col gap-3 border-b border-[#dcd9d1] pb-4 sm:flex-row sm:items-end sm:justify-between dark:border-white/10">
            <div>
              <h2 className="text-xl font-semibold tracking-[-.025em]">
                Your achievements build readiness
              </h2>
              <p className="mt-1 text-sm text-[#60708a] dark:text-zinc-400">
                Each completed course and verified credential becomes evidence
                for {model.targetRoleTitle}.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowRequirements((value) => !value)}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-300"
            >
              View role requirements
              <ChevronRightIcon
                className={cn(
                  "h-4 w-4 transition-transform",
                  showRequirements && "rotate-90",
                )}
              />
            </button>
          </div>

          <div className="hidden grid-cols-[minmax(0,1.1fr)_minmax(0,1.15fr)_150px] gap-4 border-b border-[#dcd9d1] px-1 py-3 text-[10px] font-bold uppercase tracking-[.09em] text-[#68758c] dark:border-white/10 dark:text-zinc-500 sm:grid">
            <span>Skill area</span>
            <span>Evidence you’ve earned</span>
            <span>Impact on readiness</span>
          </div>
          <div>
            {model.skillAreas.map((skill, index) => (
              <SkillEvidenceRow key={skill.title} skill={skill} index={index} />
            ))}
          </div>
          {model.skillAreas.length === 0 && (
            <EmptyInline
              title="No career evidence yet"
              description="Link an employee profile, add skills, or choose a career goal to build this view."
            />
          )}
          {showRequirements && (
            <div className="mt-4 rounded-[10px] border border-indigo-200 bg-indigo-50/70 p-4 text-sm leading-6 text-indigo-950 dark:border-indigo-900 dark:bg-indigo-950/30 dark:text-indigo-200">
              {model.targetRoleTitle} readiness combines position requirements,
              completed learning, profile skills, and verified credentials. You
              currently have {model.activeCertificates} active certificate
              {model.activeCertificates === 1 ? "" : "s"} contributing to your
              profile.
            </div>
          )}
        </div>

        <aside className="h-fit rounded-[12px] border border-[#ddd8ce] bg-white p-7 shadow-[0_8px_24px_rgba(37,45,68,.05)] dark:border-white/10 dark:bg-[#1d222e]">
          <h2 className="text-xl font-semibold tracking-[-.025em]">
            Next best move
          </h2>
          <div className="mt-7 flex items-start justify-between gap-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.12em] text-indigo-600 dark:text-indigo-300">
                Recommended for you
              </p>
              <h3 className="mt-2 text-2xl font-semibold leading-7 tracking-[-.035em]">
                {model.recommendedCourse?.title || "Choose your next course"}
              </h3>
            </div>
            <Image
              src="/learning/achievements/career-growth-badge.png"
              alt="Career growth achievement"
              width={112}
              height={112}
              unoptimized
              className="h-24 w-24 shrink-0 object-contain sm:h-28 sm:w-28"
            />
          </div>
          <p className="mt-4 text-sm leading-6 text-[#5e6b82] dark:text-zinc-400">
            {model.recommendedCourse?.description ||
              "Browse the catalog and start building evidence toward your career goal."}
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium text-[#55647c] dark:text-zinc-300">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#f0f1f4] px-3 py-1.5 dark:bg-white/10">
              <ClockIcon className="h-4 w-4" />
              {model.recommendedCourse
                ? `${model.recommendedCourse.durationHours}h`
                : "Self-paced"}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#f0f1f4] px-3 py-1.5 dark:bg-white/10">
              <BookOpenIcon className="h-4 w-4" />
              {model.recommendedCourse?.category || "Course catalog"}
            </span>
          </div>
          <Button
            asChild
            className="mt-6 h-12 w-full rounded-[8px] bg-indigo-600 text-white hover:bg-indigo-700"
          >
            <Link
              href={
                model.recommendedCourse?.id
                  ? `/learning/courses/${model.recommendedCourse.id}`
                  : "/learning/courses"
              }
            >
              {model.recommendedCourse
                ? "Start recommended course"
                : "Browse courses"}
              <ArrowRightIcon className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <button
            type="button"
            onClick={() => setShowRecommendationReason((value) => !value)}
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#4f5f77] hover:text-indigo-700 dark:text-zinc-300 dark:hover:text-indigo-300"
          >
            Why this course?
            <ChevronRightIcon
              className={cn(
                "h-4 w-4 transition-transform",
                showRecommendationReason && "rotate-90",
              )}
            />
          </button>
          {showRecommendationReason && (
            <p className="mt-3 border-t border-[#e5e2da] pt-3 text-xs leading-5 text-[#66738a] dark:border-white/10 dark:text-zinc-400">
              This recommendation is selected from active courses by matching
              the configured requirements for {model.targetRoleTitle} against
              the skills you still need to build.
            </p>
          )}
        </aside>
      </section>
    </div>
  );
}

function SkillEvidenceRow({
  skill,
  index,
}: {
  skill: AchievementSkillArea;
  index: number;
}) {
  const SkillIcon = skillIcons[index % skillIcons.length];
  return (
    <article className="grid grid-cols-1 gap-3 border-b border-[#e3e0d9] py-3.5 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1.15fr)_150px] sm:items-center sm:gap-4 dark:border-white/10">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-indigo-600 text-white">
          <SkillIcon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold">{skill.title}</h3>
          <p className="mt-0.5 truncate text-xs text-[#67738a] dark:text-zinc-400">
            {skill.description}
          </p>
        </div>
      </div>
      <div className="flex min-w-0 gap-2.5">
        <BookOpenIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#5e6b83]" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{skill.evidence}</p>
          <p className="text-xs text-[#67738a] dark:text-zinc-400">
            {skill.completedAt
              ? `Completed ${skill.completedAt}`
              : "Complete a relevant course to add evidence"}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span
          className={cn(
            "font-semibold",
            skill.strength === "Demonstrated"
              ? "text-emerald-700 dark:text-emerald-300"
              : skill.strength === "To build"
                ? "text-amber-700 dark:text-amber-300"
                : "text-[#60708a] dark:text-zinc-400",
          )}
        >
          {skill.strength}
        </span>
        <span className="font-semibold text-indigo-600 dark:text-indigo-300">
          +{skill.impact}%
        </span>
        <ChevronDownIcon className="h-4 w-4 text-[#68758c]" />
      </div>
    </article>
  );
}

function EmptyInline({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="py-12 text-center">
      <TrophyIcon className="mx-auto h-8 w-8 text-[#76849b]" />
      <h3 className="mt-3 text-sm font-semibold">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-[#66738a] dark:text-zinc-400">
        {description}
      </p>
    </div>
  );
}
